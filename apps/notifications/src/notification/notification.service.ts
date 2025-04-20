import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationResponseDto, NotificationType, CreateNotificationDto } from '@app/contracts/notifications/notification.dto';
import { RedisClientType } from 'redis';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    // Map để theo dõi các thông báo đang được xử lý
    private processingNotifications = new Map<string, number>();

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
        private readonly prisma: PrismaService
    ) {
        this.logger.log('NotificationService initialized');
        // Định kỳ dọn dẹp các thông báo quá hạn
        setInterval(() => this.cleanupExpiredNotifications(), 60000); // Mỗi phút
    }

    // Kiểm tra xem thông báo có phải là trùng lặp không
    isDuplicateNotification(notificationKey: string): boolean {
        return this.processingNotifications.has(notificationKey);
    }

    // Đánh dấu thông báo đang được xử lý
    markNotificationProcessing(notificationKey: string): void {
        this.processingNotifications.set(notificationKey, Date.now());
        this.logger.log(`Marked notification as processing: ${notificationKey}`);
    }

    // Đánh dấu thông báo đã xử lý xong
    completeNotificationProcessing(notificationKey: string): void {
        this.processingNotifications.delete(notificationKey);
        this.logger.log(`Completed notification processing: ${notificationKey}`);
    }

    // Dọn dẹp các thông báo quá hạn (quá 30 giây)
    private cleanupExpiredNotifications(): void {
        const now = Date.now();
        const expiryTime = 30 * 1000; // 30 giây, thay vì 5 phút

        for (const [key, timestamp] of this.processingNotifications.entries()) {
            if (now - timestamp > expiryTime) {
                this.processingNotifications.delete(key);
                this.logger.log(`Cleaned up expired notification: ${key}`);
            }
        }
    }

    // Tạo thông báo mới và lưu vào cả DB và Redis
    async createNotification(createDto: CreateNotificationDto): Promise<NotificationResponseDto> {
        try {
            this.logger.log(`==== NOTIFICATION CREATION START ====`);
            this.logger.log(`Creating notification for user: ${createDto.userId}`);
            this.logger.log(`Full notification data: ${JSON.stringify(createDto)}`);
            this.logger.log(`Notification type: ${createDto.type} (${typeof createDto.type})`);

            // Kiểm tra xem relatedId đã tồn tại trong DB chưa (trong vòng 30 giây)
            if (createDto.relatedId) {
                this.logger.log(`Checking for duplicate notification with relatedId: ${createDto.relatedId}`);

                // Kiểm tra trong DB xem có notification cùng relatedId được tạo trong vòng 30 giây không
                const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
                const existingNotification = await this.prisma.notification.findFirst({
                    where: {
                        relatedId: createDto.relatedId,
                        createdAt: {
                            gte: thirtySecondsAgo
                        }
                    }
                });

                if (existingNotification) {
                    this.logger.warn(`Found duplicate notification with relatedId: ${createDto.relatedId}, id: ${existingNotification.id}, created at: ${existingNotification.createdAt}`);

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
                    };

                    this.logger.log(`Returning existing notification instead of creating a duplicate`);
                    return responseDto;
                }
            }

            // Log environment variables
            this.logger.log(`DB_NOTIFICATION_SERVICE is ${process.env.DB_NOTIFICATION_SERVICE ? 'set' : 'NOT SET'}`);

            // 1. Lưu vào DB để lưu trữ lâu dài
            this.logger.log(`[1/3] Saving notification to database...`);

            try {
                this.logger.log(`Creating notification in database with data structure: ${JSON.stringify({
                    userId: createDto.userId,
                    title: createDto.title?.substring(0, 20) + '...',
                    content: createDto.content?.substring(0, 20) + '...',
                    type: createDto.type
                })}`);

                const notification = await this.prisma.notification.create({
                    data: {
                        userId: createDto.userId,
                        title: createDto.title,
                        content: createDto.content,
                        link: createDto.link,
                        type: createDto.type,
                        relatedId: createDto.relatedId,
                    },
                });
                this.logger.log(`[DB] Notification saved to database successfully with ID: ${notification.id}`);
                this.logger.log(`[DB] Full notification object from database: ${JSON.stringify(notification)}`);

                // 2. Tạo response DTO
                this.logger.log(`[2/3] Creating response DTO...`);
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
                };
                this.logger.log(`Response DTO created: ${JSON.stringify(responseDto)}`);

                // 3. Publish thông báo đến Redis để realtime
                this.logger.log(`[3/3] Publishing notification to Redis...`);
                try {
                    await this.publishNotification(responseDto);
                    this.logger.log(`Notification published to Redis successfully`);
                } catch (redisError) {
                    this.logger.error(`Failed to publish to Redis but database write was successful: ${redisError.message}`);
                    // Continue even if Redis publish fails
                }

                this.logger.log(`==== NOTIFICATION CREATION COMPLETE ====`);
                return responseDto;
            } catch (dbError) {
                this.logger.error(`Database error while creating notification:`);
                this.logger.error(`- Error message: ${dbError.message}`);
                this.logger.error(`- Error name: ${dbError.name}`);
                this.logger.error(`- Error code: ${dbError.code}`);
                this.logger.error(`- Stack: ${dbError.stack}`);
                if (dbError.meta) {
                    this.logger.error(`- Meta: ${JSON.stringify(dbError.meta)}`);
                }
                throw dbError;
            }
        } catch (error) {
            this.logger.error(`==== NOTIFICATION CREATION FAILED ====`);
            this.logger.error(`Failed to create notification: ${error.message}`);
            this.logger.error(`Error stack: ${error.stack}`);
            throw error;
        }
    }

    // Đánh dấu thông báo đã đọc
    async markAsRead(notificationId: string): Promise<NotificationResponseDto> {
        try {
            const notification = await this.prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true },
            });

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
            };

            // Cập nhật trạng thái đã đọc cho thông báo trong Redis
            await this.updateNotificationReadStatus(notificationId, true);

            return responseDto;
        } catch (error) {
            this.logger.error(`Failed to mark notification as read: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Lấy danh sách thông báo của user
    async getUserNotifications(userId: string): Promise<NotificationResponseDto[]> {
        try {
            const notifications = await this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });

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
            }));
        } catch (error) {
            this.logger.error(`Failed to get user notifications: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Publish thông báo tới Redis channel
    private async publishNotification(notification: NotificationResponseDto): Promise<void> {
        try {
            const channel = `notifications:${notification.userId}`;
            await this.redisClient.publish(channel, JSON.stringify(notification));

            // Cũng lưu thông báo mới nhất vào Redis cache để truy cập nhanh
            const cacheKey = `notifications:user:${notification.userId}`;

            // Lưu thông báo vào danh sách trong Redis, giới hạn 20 thông báo mới nhất
            await this.redisClient.lPush(cacheKey, JSON.stringify(notification));
            await this.redisClient.lTrim(cacheKey, 0, 19); // Chỉ giữ 20 thông báo mới nhất

            // Set thời gian hết hạn cho cache (6 giờ)
            await this.redisClient.expire(cacheKey, 6 * 60 * 60);

            this.logger.log(`Published notification to channel ${channel}`);
        } catch (error) {
            this.logger.error(`Failed to publish notification: ${error.message}`, error.stack);
        }
    }

    // Cập nhật trạng thái đã đọc của thông báo trong Redis
    private async updateNotificationReadStatus(notificationId: string, isRead: boolean): Promise<void> {
        try {
            // Tìm notification trong DB để lấy userId
            const notification = await this.prisma.notification.findUnique({
                where: { id: notificationId },
            });

            if (!notification) {
                return;
            }

            const cacheKey = `notifications:user:${notification.userId}`;

            // Lấy danh sách thông báo từ Redis
            const cachedNotifications = await this.redisClient.lRange(cacheKey, 0, -1);

            // Cập nhật trạng thái đã đọc
            const updatedNotifications = await Promise.all(
                cachedNotifications.map(async (notificationStr) => {
                    const cachedNotification = JSON.parse(notificationStr);
                    if (cachedNotification.id === notificationId) {
                        cachedNotification.isRead = isRead;
                    }
                    return JSON.stringify(cachedNotification);
                })
            );

            // Xóa cache cũ và thêm lại danh sách đã cập nhật
            await this.redisClient.del(cacheKey);

            if (updatedNotifications.length > 0) {
                await this.redisClient.rPush(cacheKey, updatedNotifications);
                await this.redisClient.expire(cacheKey, 24 * 60 * 60);
            }
        } catch (error) {
            this.logger.error(`Failed to update notification read status: ${error.message}`, error.stack);
        }
    }
} 