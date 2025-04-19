import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-notifications';
import { CreateNotificationDto, NotificationResponseDto, NotificationType } from '@app/contracts/notifications/notification.dto';
import { RedisClientType } from 'redis';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private prisma = new PrismaClient();

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    ) { }

    // Tạo thông báo mới và lưu vào cả DB và Redis
    async createNotification(createDto: CreateNotificationDto): Promise<NotificationResponseDto> {
        try {
            this.logger.log(`Creating notification: ${JSON.stringify(createDto)}`);

            // 1. Lưu vào DB để lưu trữ lâu dài
            this.logger.log(`Saving notification to database...`);
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
            this.logger.log(`Notification saved to database successfully: ${notification.id}`);

            // 2. Tạo response DTO
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

            // 3. Publish thông báo đến Redis để realtime
            this.logger.log(`Publishing notification to Redis: ${notification.id}`);
            await this.publishNotification(responseDto);
            this.logger.log(`Notification published to Redis successfully: ${notification.id}`);

            return responseDto;
        } catch (error) {
            this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
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