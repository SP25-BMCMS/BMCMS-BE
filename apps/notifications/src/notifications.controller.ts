import { Controller, Get, Logger } from '@nestjs/common'
import { EventPattern, MessagePattern } from '@nestjs/microservices'
import { OtpService } from './otp/otp.service'
import { EmailService } from './email/email.service'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { NotificationService } from './notification/notification.service'
import { CreateNotificationDto, MarkNotificationReadDto } from '@app/contracts/notifications/notification.dto'
import { NotificationType } from '@app/contracts/notifications/notification.dto'

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService
  ) {
  }

  @MessagePattern('*')
  async logAllMessages(data: any, metadata?: any) {
    this.logger.log(`[Global] Received message with pattern: ${metadata?.pattern || 'unknown'}`);
    return { received: true, timestamp: new Date().toISOString() };
  }

  @EventPattern('*')
  async logAllEvents(data: any, metadata?: any) {
    this.logger.log(`[Global] Received event with pattern: ${metadata?.pattern || 'unknown'}`);
  }

  @MessagePattern('ping')
  ping() {
    this.logger.log('Received ping request');
    return { success: true, message: 'pong', timestamp: new Date().toISOString() };
  }

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
    this.logger.log(`[EventPattern] INCOMING NOTIFICATION REQUEST: user=${data.userId}, type=${data.type}, title=${data.title?.substring(0, 15)}...`);
    this.logger.log(`[EventPattern] Complete notification data: ${JSON.stringify(data)}`);

    try {
      // Validate data
      if (!data.userId || !data.title || !data.content || !data.type) {
        this.logger.error(`[EventPattern] Invalid notification data: ${JSON.stringify(data)}`);
        return { success: false, message: 'Invalid notification data' };
      }

      // Log before createNotification
      this.logger.log(`[EventPattern] Calling notification service to create notification`);

      try {
        const notification = await this.notificationService.createNotification(data);

        // Log after createNotification  
        this.logger.log(`[EventPattern] Notification created successfully with ID: ${notification.id}`);
        this.logger.log(`[EventPattern] Full notification details: ${JSON.stringify(notification)}`);

        return { success: true, data: notification };
      } catch (serviceError) {
        this.logger.error(`[EventPattern] Service error creating notification: ${serviceError.message}`, serviceError.stack);
        this.logger.error(`[EventPattern] Error details: ${JSON.stringify(serviceError)}`);
        return { success: false, message: serviceError.message };
      }
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

      try {
        const notification = await this.notificationService.createNotification(data);

        // Log after createNotification
        this.logger.log(`[MessagePattern] Notification created successfully with ID: ${notification.id}`);
        this.logger.log(`[MessagePattern] Full notification details: ${JSON.stringify(notification)}`);

        return { success: true, data: notification };
      } catch (serviceError) {
        this.logger.error(`[MessagePattern] Service error creating notification: ${serviceError.message}`, serviceError.stack);
        this.logger.error(`[MessagePattern] Error details: ${JSON.stringify(serviceError)}`);
        return { success: false, message: serviceError.message };
      }
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

  @MessagePattern('test_notification')
  async testNotification() {
    this.logger.log('Received test notification request');
    try {
      // Create a test notification
      const testData: CreateNotificationDto = {
        userId: 'test-user-id',
        title: 'Test Notification',
        content: 'This is a test notification to verify database access',
        type: NotificationType.SYSTEM,
        link: '/test'
      };

      this.logger.log(`Creating test notification with data: ${JSON.stringify(testData)}`);

      const result = await this.notificationService.createNotification(testData);
      this.logger.log(`Test notification created successfully: ${JSON.stringify(result)}`);

      return {
        success: true,
        message: 'Test notification created successfully',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to create test notification: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to create test notification: ${error.message}`,
        error: JSON.stringify(error)
      };
    }
  }
}
