import { Controller, Get, Logger } from '@nestjs/common'
import { EventPattern, MessagePattern } from '@nestjs/microservices'
import { OtpService } from './otp/otp.service'
import { EmailService } from './email/email.service'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { NotificationService } from './notification/notification.service'
import { CreateNotificationDto, MarkNotificationReadDto } from '@app/contracts/notifications/notification.dto'

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService
  ) { }

  @EventPattern('send_otp')
  async handleSendOtp(data: { email: string }) {
    return await this.otpService.createOTP(data.email)
  }

  @EventPattern('send_otp_message')
  async handleSendOtpMessage(data: { email: string }) {
    this.logger.log(`[MessagePattern] Received OTP request for: ${data.email}, time: ${new Date().toISOString()}`);
    const otp = await this.otpService.createOTP(data.email);
    return { success: true, otp };
  }

  @EventPattern('verify_otp')
  async handleVerifyOtp(data: { email: string; otp: string }) {
    return this.otpService.verifyOTP(data.email, data.otp)
  }

  @MessagePattern(NOTIFICATIONS_PATTERN.SEND_EMAIL)
  async handleSendEmail(data: {
    to: string
    residentName: string
    buildingName: string
    maintenanceDate: Date
    startTime: string
    endTime: string
    maintenanceType: string
    description: string
    floor: string
    area: string
    unit: string
  }) {
    this.logger.log(`[MessagePattern] Received email request for: ${data.to}, building: ${data.buildingName}, time: ${new Date().toISOString()}`);
    const result = await this.emailService.sendMaintenanceEmail(data);
    return { success: result };
  }

  @EventPattern(NOTIFICATIONS_PATTERN.SEND_MAINTENANCE_SCHEDULE_EMAIL)
  async handleMaintenanceEmail(data: {
    to: string
    residentName: string
    buildingName: string
    maintenanceDate: Date
    startTime: string
    endTime: string
    maintenanceType: string
    description: string
    floor: string
    area: string
    unit: string
  }) {
    this.logger.log(`[EventPattern] Received maintenance email request for: ${data.to}, building: ${data.buildingName}, time: ${new Date().toISOString()}`);
    const result = await this.emailService.sendMaintenanceEmail(data)
    if (!result) {
      console.error('Failed to send maintenance email to:', data.to)
    }
  }

  @EventPattern(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION)
  async handleCreateNotification(data: CreateNotificationDto) {
    this.logger.log(`[EventPattern] Creating notification for user: ${data.userId}, type: ${data.type}, data: ${JSON.stringify(data)}`);
    try {
      // Validate data
      if (!data.userId || !data.title || !data.content || !data.type) {
        this.logger.error(`[EventPattern] Invalid notification data: ${JSON.stringify(data)}`);
        return { success: false, message: 'Invalid notification data' };
      }

      // Log before createNotification
      this.logger.log(`[EventPattern] Calling notification service to create notification`);

      const notification = await this.notificationService.createNotification(data);

      // Log after createNotification
      this.logger.log(`[EventPattern] Notification created successfully: ${JSON.stringify(notification)}`);

      return { success: true, data: notification };
    } catch (error) {
      this.logger.error(`[EventPattern] Error creating notification: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION)
  async handleCreateNotificationMessage(data: CreateNotificationDto) {
    this.logger.log(`[MessagePattern] Creating notification for user: ${data.userId}, type: ${data.type}, data: ${JSON.stringify(data)}`);
    try {
      // Validate data
      if (!data.userId || !data.title || !data.content || !data.type) {
        this.logger.error(`[MessagePattern] Invalid notification data: ${JSON.stringify(data)}`);
        return { success: false, message: 'Invalid notification data' };
      }

      // Log before createNotification
      this.logger.log(`[MessagePattern] Calling notification service to create notification`);

      const notification = await this.notificationService.createNotification(data);

      // Log after createNotification
      this.logger.log(`[MessagePattern] Notification created successfully: ${JSON.stringify(notification)}`);

      return { success: true, data: notification };
    } catch (error) {
      this.logger.error(`[MessagePattern] Error creating notification: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern(NOTIFICATIONS_PATTERN.GET_USER_NOTIFICATIONS)
  async handleGetUserNotifications(data: { userId: string }) {
    this.logger.log(`[MessagePattern] Getting notifications for user: ${data.userId}`);
    try {
      const notifications = await this.notificationService.getUserNotifications(data.userId);
      return { success: true, data: notifications };
    } catch (error) {
      this.logger.error(`Error getting user notifications: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern(NOTIFICATIONS_PATTERN.MARK_NOTIFICATION_READ)
  async handleMarkNotificationRead(data: MarkNotificationReadDto) {
    this.logger.log(`[MessagePattern] Marking notification as read: ${data.notificationId}`);
    try {
      const notification = await this.notificationService.markAsRead(data.notificationId);
      return { success: true, data: notification };
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
