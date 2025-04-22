import { Inject, Injectable, Logger } from '@nestjs/common'
import { NotificationResponseDto, NotificationType, CreateNotificationDto } from '@app/contracts/notifications/notification.dto'
import { RedisClientType } from 'redis'
import { PrismaService } from '../../prisma/prisma.service'
import { Observable } from 'rxjs'
import { MessageEvent } from '@nestjs/common'

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    // Map để theo dõi các thông báo đang được xử lý
    private processingNotifications = new Map<string, number>();

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
        private readonly prisma: PrismaService
    ) {
        this.logger.log('NotificationService initialized')
        // Định kỳ dọn dẹp các thông báo quá hạn
        setInterval(() => this.cleanupExpiredNotifications(), 60000) // Mỗi phút
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
        const expiryTime = 30 * 1000 // 30 giây, thay vì 5 phút

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
            this.logger.log(`==== NOTIFICATION CREATION START ====`)
            this.logger.log(`Creating notification for user: ${createDto.userId}`)
            this.logger.log(`Full notification data: ${JSON.stringify(createDto)}`)
            this.logger.log(`Notification type: ${createDto.type} (${typeof createDto.type})`)

            // Kiểm tra xem relatedId đã tồn tại trong DB chưa (trong vòng 30 giây)
            if (createDto.relatedId) {
                this.logger.log(`Checking for duplicate notification with relatedId: ${createDto.relatedId}`)

                // Kiểm tra trong DB xem có notification cùng relatedId được tạo trong vòng 30 giây không
                const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)
                const existingNotification = await this.prisma.notification.findFirst({
                    where: {
                        relatedId: createDto.relatedId,
                        createdAt: {
                            gte: thirtySecondsAgo
                        }
                    }
                })

                if (existingNotification) {
                    this.logger.warn(`Found duplicate notification with relatedId: ${createDto.relatedId}, id: ${existingNotification.id}, created at: ${existingNotification.createdAt}`)

                    // Trả về thông báo hiện có thay vì tạo mới
                    const responseDto: NotificationResponseDto = {
                        id: existingNotification.id,
                        userId: existingNotification.userId,
                        title: existingNotification.title,
                        content: existingNotification.content,
                        link: existingNotification.link,
                        isRead: existingNotification.isRead,
                        type: existingNotification.type as NotificationType,
                        relatedId: existingNotification.relatedId,
                        createdAt: existingNotification.createdAt,
                    }

                    this.logger.log(`Returning existing notification instead of creating a duplicate`)
                    return responseDto
                }
            }

            // Log environment variables
            this.logger.log(`DB_NOTIFICATION_SERVICE is ${process.env.DB_NOTIFICATION_SERVICE ? 'set' : 'NOT SET'}`)

            // 1. Lưu vào DB để lưu trữ lâu dài
            this.logger.log(`[1/3] Saving notification to database...`)

            try {
                this.logger.log(`Creating notification in database with data structure: ${JSON.stringify({
                    userId: createDto.userId,
                    title: createDto.title?.substring(0, 20) + '...',
                    content: createDto.content?.substring(0, 20) + '...',
                    type: createDto.type
                })}`)

                const notification = await this.prisma.notification.create({
                    data: {
                        userId: createDto.userId,
                        title: createDto.title,
                        content: createDto.content,
                        link: createDto.link,
                        type: createDto.type,
                        relatedId: createDto.relatedId,
                    },
                })
                this.logger.log(`[DB] Notification saved to database successfully with ID: ${notification.id}`)
                this.logger.log(`[DB] Full notification object from database: ${JSON.stringify(notification)}`)

                // 2. Tạo response DTO
                this.logger.log(`[2/3] Creating response DTO...`)
                const responseDto: NotificationResponseDto = {
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
                this.logger.log(`Response DTO created: ${JSON.stringify(responseDto)}`)

                // 3. Publish thông báo đến Redis để realtime
                this.logger.log(`[3/3] Publishing notification to Redis...`)
                try {
                    await this.publishNotification(responseDto)
                    this.logger.log(`Notification published to Redis successfully`)
                } catch (redisError) {
                    this.logger.error(`Failed to publish to Redis but database write was successful: ${redisError.message}`)
                    // Continue even if Redis publish fails
                }

                this.logger.log(`==== NOTIFICATION CREATION COMPLETE ====`)
                return responseDto
            } catch (dbError) {
                this.logger.error(`Database error while creating notification:`)
                this.logger.error(`- Error message: ${dbError.message}`)
                this.logger.error(`- Error name: ${dbError.name}`)
                this.logger.error(`- Error code: ${dbError.code}`)
                this.logger.error(`- Stack: ${dbError.stack}`)
                if (dbError.meta) {
                    this.logger.error(`- Meta: ${JSON.stringify(dbError.meta)}`)
                }
                throw dbError
            }
        } catch (error) {
            this.logger.error(`==== NOTIFICATION CREATION FAILED ====`)
            this.logger.error(`Failed to create notification: ${error.message}`)
            this.logger.error(`Error stack: ${error.stack}`)
            throw error
        }
    }

    // Đánh dấu thông báo đã đọc
    async markAsRead(notificationId: string): Promise<NotificationResponseDto> {
        try {
            const notification = await this.prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true },
            })

            const responseDto: NotificationResponseDto = {
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

            // Cập nhật trạng thái đã đọc cho thông báo trong Redis
            await this.updateNotificationReadStatus(notificationId, true)

            return responseDto
        } catch (error) {
            this.logger.error(`Failed to mark notification as read: ${error.message}`, error.stack)
            throw error
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
            const channel = `notifications:${notification.userId}`
            await this.redisClient.publish(channel, JSON.stringify(notification))

            // Cũng lưu thông báo mới nhất vào Redis cache để truy cập nhanh
            const cacheKey = `notifications:user:${notification.userId}`

            // Lưu thông báo vào danh sách trong Redis, giới hạn 20 thông báo mới nhất
            await this.redisClient.lPush(cacheKey, JSON.stringify(notification))
            await this.redisClient.lTrim(cacheKey, 0, 19) // Chỉ giữ 20 thông báo mới nhất

            // Set thời gian hết hạn cho cache (6 giờ)
            await this.redisClient.expire(cacheKey, 6 * 60 * 60)

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

            const cacheKey = `notifications:user:${notification.userId}`

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
                await this.redisClient.expire(cacheKey, 24 * 60 * 60)
            }
        } catch (error) {
            this.logger.error(`Failed to update notification read status: ${error.message}`, error.stack)
        }
    }

    createNotificationStream(userId: string): Observable<MessageEvent> {
        this.logger.log(`Creating notification stream for user: ${userId}`)

        return new Observable<MessageEvent>(subscriber => {
            const channel = `notifications:${userId}`

            // Tạo một Redis client mới để lắng nghe channel
            const subscriberClient = this.redisClient.duplicate()

            // Kết nối và subscribe vào channel
            subscriberClient.subscribe(channel, (err) => {
                if (err) {
                    this.logger.error(`Failed to subscribe to channel ${channel}:`, err)
                    subscriber.error(err)
                    return
                }

                this.logger.log(`Subscribed to Redis channel: ${channel}`)

                // Gửi tin nhắn xác nhận kết nối thành công
                subscriber.next({
                    data: {
                        connected: true,
                        userId: userId,
                        timestamp: new Date().toISOString()
                    }
                })
            })

            // Lắng nghe tin nhắn từ Redis channel
            subscriberClient.on('message', (receivedChannel, message) => {
                if (receivedChannel === channel) {
                    try {
                        const notification = JSON.parse(message)
                        this.logger.log(`Received notification for user ${userId}: ${notification.title}`)

                        // Gửi notification về client qua SSE
                        subscriber.next({ data: notification })
                    } catch (error) {
                        this.logger.error(`Error parsing notification for user ${userId}:`, error)
                    }
                }
            })

            // Cleanup khi client ngắt kết nối
            return () => {
                this.logger.log(`Cleaning up Redis subscription for user ${userId}`)
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
            this.logger.log(`[Service] Marking all notifications as read for user: ${userId}`)

            // Thực hiện trong transaction
            const result = await this.prisma.$transaction(async (prisma) => {
                // 1. Đếm số lượng thông báo chưa đọc
                const unreadCount = await prisma.notification.count({
                    where: {
                        OR: [
                            { userId: userId },
                            { userId: 'system' }
                        ],
                        isRead: false
                    }
                })

                // 2. Cập nhật tất cả thông báo chưa đọc
                const updateResult = await prisma.notification.updateMany({
                    where: {
                        OR: [
                            { userId: userId },
                            { userId: 'system' }
                        ],
                        isRead: false
                    },
                    data: {
                        isRead: true,
                        updatedAt: new Date()
                    }
                })

                // 3. Lấy danh sách notifications đã cập nhật để cập nhật cache
                const updatedNotifications = await prisma.notification.findMany({
                    where: {
                        OR: [
                            { userId: userId },
                            { userId: 'system' }
                        ]
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 100 // Giới hạn số lượng để tối ưu performance
                })

                return { unreadCount, updateResult, updatedNotifications }
            })

            // Cập nhật Redis cache
            const cacheKey = `notifications:user:${userId}`
            await this.redisClient.del(cacheKey)

            if (result.updatedNotifications.length > 0) {
                const notificationsToCache = result.updatedNotifications.map(notification => {
                    return JSON.stringify({
                        id: notification.id,
                        userId: notification.userId,
                        title: notification.title,
                        content: notification.content,
                        type: notification.type,
                        link: notification.link,
                        isRead: true,
                        relatedId: notification.relatedId,
                        createdAt: notification.createdAt,
                        updatedAt: new Date()
                    })
                })

                await this.redisClient.rPush(cacheKey, notificationsToCache)
                await this.redisClient.expire(cacheKey, 24 * 60 * 60) // Cache 24h
            }

            // Gửi thông báo realtime
            const systemNotification = {
                id: `system-update-${Date.now()}`,
                userId: userId,
                title: 'Notifications Updated',
                content: `${result.unreadCount} notifications have been marked as read`,
                type: NotificationType.SYSTEM,
                isRead: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            await this.publishNotification(systemNotification)

            return {
                success: true,
                message: `Successfully marked ${result.unreadCount} notifications as read`
            }

        } catch (error) {
            this.logger.error(`[Service] Failed to mark all notifications as read: ${error.message}`, error.stack)
            throw new Error(`Failed to mark all notifications as read: ${error.message}`)
        }
    }

    /**
     * Xóa tất cả thông báo (trừ thông báo hệ thống)
     */
    async clearAll(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            this.logger.log(`[Service] Clearing all notifications for user: ${userId}`)

            // Thực hiện trong transaction
            const result = await this.prisma.$transaction(async (prisma) => {
                // 1. Đếm số lượng thông báo sẽ xóa
                const countToDelete = await prisma.notification.count({
                    where: {
                        userId: userId,
                        type: {
                            not: NotificationType.SYSTEM
                        }
                    }
                })

                // 2. Xóa tất cả thông báo (trừ system)
                await prisma.notification.deleteMany({
                    where: {
                        userId: userId,
                        type: {
                            not: NotificationType.SYSTEM
                        }
                    }
                })

                // 3. Lấy các thông báo hệ thống còn lại
                const systemNotifications = await prisma.notification.findMany({
                    where: {
                        OR: [
                            { userId: 'system' },
                            {
                                userId: userId,
                                type: NotificationType.SYSTEM
                            }
                        ]
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                })

                return { countToDelete, systemNotifications }
            })

            // Cập nhật Redis cache - chỉ giữ lại thông báo hệ thống
            const cacheKey = `notifications:user:${userId}`
            await this.redisClient.del(cacheKey)

            if (result.systemNotifications.length > 0) {
                const systemNotificationsToCache = result.systemNotifications.map(notification =>
                    JSON.stringify({
                        id: notification.id,
                        userId: notification.userId,
                        title: notification.title,
                        content: notification.content,
                        type: notification.type,
                        link: notification.link,
                        isRead: notification.isRead,
                        relatedId: notification.relatedId,
                        createdAt: notification.createdAt,
                        updatedAt: notification.updatedAt
                    })
                )

                await this.redisClient.rPush(cacheKey, systemNotificationsToCache)
                await this.redisClient.expire(cacheKey, 24 * 60 * 60)
            }

            // Gửi thông báo realtime về việc xóa
            const systemNotification = {
                id: `system-clear-${Date.now()}`,
                userId: userId,
                title: 'Notifications Cleared',
                content: `${result.countToDelete} notifications have been cleared`,
                type: NotificationType.SYSTEM,
                isRead: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            await this.publishNotification(systemNotification)

            return {
                success: true,
                message: `Successfully cleared ${result.countToDelete} notifications`
            }

        } catch (error) {
            this.logger.error(`[Service] Failed to clear all notifications: ${error.message}`, error.stack)
            throw new Error(`Failed to clear all notifications: ${error.message}`)
        }
    }
} 