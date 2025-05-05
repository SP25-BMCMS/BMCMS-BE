import { Inject, Injectable, Logger } from '@nestjs/common'
import { NotificationResponseDto, NotificationType, CreateNotificationDto } from '@app/contracts/notifications/notification.dto'
import { RedisClientType } from 'redis'
import { PrismaService } from '../../prisma/prisma.service'
import { Observable } from 'rxjs'
import { MessageEvent } from '@nestjs/common'

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly CACHE_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
    private readonly NOTIFICATION_LIMIT = 100; // Limit for pagination
    private processingNotifications = new Map<string, number>();

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
        private readonly prisma: PrismaService
    ) {
        this.logger.log('NotificationService initialized')
        setInterval(() => this.cleanupExpiredNotifications(), 60000)
    }

    // Helper method to create Redis cache key
    private getCacheKey(userId: string): string {
        return `notifications:user:${userId}`
    }

    // Helper method to create Redis channel key
    private getChannelKey(userId: string): string {
        return `notifications:${userId}`
    }

    // Helper method to convert DB notification to DTO
    private toNotificationDto(notification: any): NotificationResponseDto {
        return {
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            content: notification.content,
            link: notification.link,
            isRead: notification.isRead,
            type: notification.type as NotificationType,
            relatedId: notification.relatedId,
            createdAt: notification.createdAt,
        }
    }

    // Kiểm tra xem thông báo có phải là trùng lặp không
    isDuplicateNotification(notificationKey: string): boolean {
        return this.processingNotifications.has(notificationKey)
    }

    // Đánh dấu thông báo đang được xử lý
    markNotificationProcessing(notificationKey: string): void {
        this.processingNotifications.set(notificationKey, Date.now())
        this.logger.log(`Marked notification as processing: ${notificationKey}`)
    }

    // Đánh dấu thông báo đã xử lý xong
    completeNotificationProcessing(notificationKey: string): void {
        this.processingNotifications.delete(notificationKey)
        this.logger.log(`Completed notification processing: ${notificationKey}`)
    }

    // Dọn dẹp các thông báo quá hạn (quá 30 giây)
    private cleanupExpiredNotifications(): void {
        const now = Date.now()
        const expiryTime = 30 * 1000 // 30 seconds

        for (const [key, timestamp] of this.processingNotifications.entries()) {
            if (now - timestamp > expiryTime) {
                this.processingNotifications.delete(key)
                this.logger.log(`Cleaned up expired notification: ${key}`)
            }
        }
    }

    // Tạo thông báo mới và lưu vào cả DB và Redis
    async createNotification(createDto: CreateNotificationDto): Promise<NotificationResponseDto> {
        try {
            this.logger.log(`Creating notification for user: ${createDto.userId}`)

            // Check for duplicate within 30 seconds
            if (createDto.relatedId) {
                const existingNotification = await this.checkDuplicateNotification(createDto.relatedId)
                if (existingNotification) {
                    return this.toNotificationDto(existingNotification)
                }
            }

            // Create notification in transaction
            const notification = await this.prisma.$transaction(async (prisma) => {
                const created = await prisma.notification.create({
                    data: {
                        userId: createDto.userId,
                        title: createDto.title,
                        content: createDto.content,
                        link: createDto.link,
                        type: createDto.type,
                        relatedId: createDto.relatedId,
                    },
                })

                return created
            })

            const responseDto = this.toNotificationDto(notification)

            // Update Redis cache and publish notification
            await Promise.all([
                this.updateBulkCache(notification.userId, [notification]),
                this.publishNotification(responseDto)
            ])

            return responseDto
        } catch (error) {
            this.logger.error(`Failed to create notification: ${error.message}`, {
                error: error,
                stack: error.stack,
                context: 'NotificationService'
            })
            throw new NotificationError(error.message, error.code)
        }
    }

    // Đánh dấu thông báo đã đọc
    async markAsRead(notificationId: string): Promise<NotificationResponseDto> {
        try {
            const notification = await this.prisma.$transaction(async (prisma) => {
                const updated = await prisma.notification.update({
                    where: { id: notificationId },
                    data: { isRead: true },
                })
                return updated
            })

            const responseDto = this.toNotificationDto(notification)
            await this.updateNotificationReadStatus(notificationId, true)

            return responseDto
        } catch (error) {
            this.logger.error(`Failed to mark notification as read: ${error.message}`, {
                error: error,
                stack: error.stack,
                context: 'NotificationService'
            })
            throw new NotificationError(error.message, error.code)
        }
    }

    // Lấy danh sách thông báo của user
    async getUserNotifications(userId: string): Promise<NotificationResponseDto[]> {
        try {
            // Lấy cả thông báo của người dùng và thông báo hệ thống (từ 'system')
            const notifications = await this.prisma.notification.findMany({
                where: {
                    OR: [
                        { userId: userId },
                        { userId: 'system' } // Thêm điều kiện lấy notification system
                    ]
                },
                orderBy: { createdAt: 'desc' },
            })

            return notifications.map(notification => ({
                id: notification.id,
                userId: notification.userId,
                title: notification.title,
                content: notification.content,
                link: notification.link,
                isRead: notification.isRead,
                type: notification.type as NotificationType,
                relatedId: notification.relatedId,
                createdAt: notification.createdAt,
            }))
        } catch (error) {
            this.logger.error(`Failed to get user notifications: ${error.message}`, error.stack)
            throw error
        }
    }

    // Publish thông báo tới Redis channel
    private async publishNotification(notification: NotificationResponseDto): Promise<void> {
        try {
            const channel = this.getChannelKey(notification.userId)
            await this.redisClient.publish(channel, JSON.stringify(notification))

            // Cũng lưu thông báo mới nhất vào Redis cache để truy cập nhanh
            const cacheKey = this.getCacheKey(notification.userId)

            // Lưu thông báo vào danh sách trong Redis, giới hạn 20 thông báo mới nhất
            await this.redisClient.lPush(cacheKey, JSON.stringify(notification))
            await this.redisClient.lTrim(cacheKey, 0, this.NOTIFICATION_LIMIT - 1) // Chỉ giữ 20 thông báo mới nhất

            // Set thời gian hết hạn cho cache (6 giờ)
            await this.redisClient.expire(cacheKey, this.CACHE_EXPIRY)

            this.logger.log(`Published notification to channel ${channel}`)
        } catch (error) {
            this.logger.error(`Failed to publish notification: ${error.message}`, error.stack)
        }
    }

    // Cập nhật trạng thái đã đọc của thông báo trong Redis
    private async updateNotificationReadStatus(notificationId: string, isRead: boolean): Promise<void> {
        try {
            // Tìm notification trong DB để lấy userId
            const notification = await this.prisma.notification.findUnique({
                where: { id: notificationId },
            })

            if (!notification) {
                return
            }

            const cacheKey = this.getCacheKey(notification.userId)

            // Lấy danh sách thông báo từ Redis
            const cachedNotifications = await this.redisClient.lRange(cacheKey, 0, -1)

            // Cập nhật trạng thái đã đọc
            const updatedNotifications = await Promise.all(
                cachedNotifications.map(async (notificationStr) => {
                    const cachedNotification = JSON.parse(notificationStr)
                    if (cachedNotification.id === notificationId) {
                        cachedNotification.isRead = isRead
                    }
                    return JSON.stringify(cachedNotification)
                })
            )

            // Xóa cache cũ và thêm lại danh sách đã cập nhật
            await this.redisClient.del(cacheKey)

            if (updatedNotifications.length > 0) {
                await this.redisClient.rPush(cacheKey, updatedNotifications)
                await this.redisClient.expire(cacheKey, this.CACHE_EXPIRY)
            }
        } catch (error) {
            this.logger.error(`Failed to update notification read status: ${error.message}`, error.stack)
        }
    }

    createNotificationStream(userId: string): Observable<MessageEvent> {
        return new Observable<MessageEvent>(subscriber => {
            const channel = this.getChannelKey(userId)
            const subscriberClient = this.redisClient.duplicate()

            subscriberClient.subscribe(channel, (err) => {
                if (err) {
                    this.logger.error(`Failed to subscribe to channel ${channel}:`, err)
                    subscriber.error(err)
                    return
                }

                subscriber.next({
                    data: {
                        connected: true,
                        userId,
                        timestamp: new Date().toISOString()
                    }
                })
            })

            subscriberClient.on('message', (receivedChannel, message) => {
                if (receivedChannel === channel) {
                    try {
                        const notification = JSON.parse(message)
                        subscriber.next({ data: notification })
                    } catch (error) {
                        this.logger.error(`Error parsing notification: ${error.message}`)
                    }
                }
            })

            return () => {
                subscriberClient.unsubscribe(channel)
                subscriberClient.quit()
            }
        })
    }

    /**
     * Đánh dấu tất cả thông báo là đã đọc
     */
    async markAllAsRead(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const result = await this.prisma.$transaction(async (prisma) => {
                // Update all unread notifications
                const { count } = await prisma.notification.updateMany({
                    where: {
                        OR: [
                            { userId: userId },
                            { userId: 'system' }
                        ],
                        isRead: false
                    },
                    data: { isRead: true }
                })

                // Get updated notifications for cache
                const notifications = await prisma.notification.findMany({
                    where: {
                        OR: [
                            { userId: userId },
                            { userId: 'system' }
                        ]
                    },
                    orderBy: { createdAt: 'desc' },
                    take: this.NOTIFICATION_LIMIT
                })

                return { count, notifications }
            })

            // Update Redis cache
            await this.updateBulkCache(userId, result.notifications)

            // Send system notification
            await this.sendSystemNotification(userId, {
                title: 'Cập nhật thông báo',
                content: `Đã đánh dấu ${result.count} thông báo là đã đọc`,
                type: NotificationType.SYSTEM
            })

            return {
                success: true,
                message: `Đã đánh dấu ${result.count} thông báo là đã đọc`
            }
        } catch (error) {
            this.logger.error(`Failed to mark all notifications as read: ${error.message}`, {
                error: error,
                stack: error.stack,
                context: 'NotificationService'
            })
            throw new NotificationError(error.message, error.code)
        }
    }

    /**
     * Xóa tất cả thông báo (trừ thông báo hệ thống)
     */
    async clearAll(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const result = await this.prisma.$transaction(async (prisma) => {
                // Delete non-system notifications
                const { count } = await prisma.notification.deleteMany({
                    where: {
                        userId: userId,
                        type: { not: NotificationType.SYSTEM }
                    }
                })

                // Get remaining system notifications
                const systemNotifications = await prisma.notification.findMany({
                    where: {
                        OR: [
                            { userId: 'system' },
                            { userId: userId, type: NotificationType.SYSTEM }
                        ]
                    },
                    orderBy: { createdAt: 'desc' }
                })

                return { count, systemNotifications }
            })

            // Update Redis cache with remaining system notifications
            await this.updateBulkCache(userId, result.systemNotifications)

            // Send system notification
            await this.sendSystemNotification(userId, {
                title: 'Xóa thông báo',
                content: `Đã xóa ${result.count} thông báo`,
                type: NotificationType.SYSTEM
            })

            return {
                success: true,
                message: `Đã xóa ${result.count} thông báo`
            }
        } catch (error) {
            this.logger.error(`Failed to clear all notifications: ${error.message}`, {
                error: error,
                stack: error.stack,
                context: 'NotificationService'
            })
            throw new NotificationError(error.message, error.code)
        }
    }

    // Helper method for checking duplicate notifications
    private async checkDuplicateNotification(relatedId: string) {
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)
        return await this.prisma.notification.findFirst({
            where: {
                relatedId,
                createdAt: { gte: thirtySecondsAgo }
            }
        })
    }

    // Helper method for bulk cache updates
    private async updateBulkCache(userId: string, notifications: any[]): Promise<void> {
        const cacheKey = this.getCacheKey(userId)
        await this.redisClient.del(cacheKey)

        if (notifications.length > 0) {
            const notificationsToCache = notifications.map(n => JSON.stringify(this.toNotificationDto(n)))
            await this.redisClient.rPush(cacheKey, notificationsToCache)
            await this.redisClient.expire(cacheKey, this.CACHE_EXPIRY)
        }
    }

    // Helper method for sending system notifications
    private async sendSystemNotification(userId: string, notification: {
        title: string
        content: string
        type: NotificationType
    }): Promise<void> {
        const systemNotification = {
            id: `system-${Date.now()}`,
            userId,
            ...notification,
            isRead: true,
            createdAt: new Date(),
            link: null,
            relatedId: null
        }

        await this.publishNotification(systemNotification as NotificationResponseDto)
    }
}

// Thêm custom error class
export class NotificationError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message)
        this.name = 'NotificationError'
    }
} 