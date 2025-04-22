import { Controller, Get, Logger } from '@nestjs/common'
import { EventPattern, MessagePattern } from '@nestjs/microservices'
import { OtpService } from './otp/otp.service'
import { EmailService } from './email/email.service'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { NotificationService } from './notification/notification.service'
import { CreateNotificationDto, MarkNotificationReadDto } from '@app/contracts/notifications/notification.dto'
import { NotificationType } from '@app/contracts/notifications/notification.dto'
import { Observable } from 'rxjs'
import { MessageEvent } from '@nestjs/common'

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
    this.logger.log(`[Global] Received message with pattern: ${metadata?.pattern || 'unknown'}`)
    return { received: true, timestamp: new Date().toISOString() }
  }

  @EventPattern('*')
  async logAllEvents(data: any, metadata?: any) {
    this.logger.log(`[Global] Received event with pattern: ${metadata?.pattern || 'unknown'}`)
  }

  @MessagePattern('ping')
  ping() {
    this.logger.log('Received ping request')
    return { success: true, message: 'pong', timestamp: new Date().toISOString() }
  }

  @EventPattern('send_otp')
  async handleSendOtp(data: { email: string }) {
    return await this.otpService.createOTP(data.email)
  }

  @EventPattern('send_otp_message')
  async handleSendOtpMessage(data: { email: string }) {
    this.logger.log(`[MessagePattern] Received OTP request for: ${data.email}, time: ${new Date().toISOString()}`)
    const otp = await this.otpService.createOTP(data.email)
    return { success: true, otp }
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
    this.logger.log(`[MessagePattern] Received email request for: ${data.to}, building: ${data.buildingName}, time: ${new Date().toISOString()}`)
    const result = await this.emailService.sendMaintenanceEmail(data)
    return { success: result }
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
    this.logger.log(`[EventPattern] Received maintenance email request for: ${data.to}, building: ${data.buildingName}, time: ${new Date().toISOString()}`)
    const result = await this.emailService.sendMaintenanceEmail(data)
    if (!result) {
      console.error('Failed to send maintenance email to:', data.to)
    }
  }

  @EventPattern(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION)
  async handleCreateNotification(data: CreateNotificationDto) {
    this.logger.log(`[EventPattern] INCOMING NOTIFICATION REQUEST: user=${data.userId || 'BROADCAST'}, type=${data.type}, title=${data.title?.substring(0, 15)}...`)

    // Tạo key duy nhất từ dữ liệu thông báo KHÔNG bao gồm timestamp để có thể phát hiện trùng lặp
    const notificationKey = `${data.userId || 'broadcast'}-${data.type}-${data.relatedId || ''}`

    this.logger.log(`[EventPattern] Notification key generated: ${notificationKey}`)

    // Kiểm tra xem thông báo này đã được xử lý chưa
    if (this.notificationService.isDuplicateNotification(notificationKey)) {
      this.logger.warn(`[EventPattern] Duplicate notification detected: ${notificationKey} - skipping`)
      return { success: false, message: 'Duplicate notification' }
    }

    // Đánh dấu thông báo này đang được xử lý
    this.notificationService.markNotificationProcessing(notificationKey)

    try {
      // Còn lại của phương thức giữ nguyên...
      this.logger.log(`[EventPattern] Complete notification data: ${JSON.stringify(data)}`)

      // Validate data
      if ((!data.userId && !data.broadcastToAll && !data.userIds) || !data.title || !data.content || !data.type) {
        this.logger.error(`[EventPattern] Invalid notification data: ${JSON.stringify(data)}`)
        return { success: false, message: 'Invalid notification data' }
      }

      let result

      // For broadcast notifications, create a system-wide notification
      if (data.broadcastToAll) {
        this.logger.log(`[EventPattern] Broadcasting notification to all users`)

        // Use a system user ID for broadcast notifications
        const broadcastData = {
          ...data,
          userId: 'system' // Use a system user ID for the database record
        }

        try {
          const notification = await this.notificationService.createNotification(broadcastData)

          // Additional logic for broadcasting to all users could be implemented here
          // For example, you might want to push this to a special Redis channel

          this.logger.log(`[EventPattern] Broadcast notification created successfully with ID: ${notification.id}`)
          result = { success: true, data: notification }
        } catch (broadcastError) {
          this.logger.error(`[EventPattern] Error creating broadcast notification: ${broadcastError.message}`)
          result = { success: false, message: broadcastError.message }
        }
      }
      // For multiple user IDs, create multiple notifications
      else if (data.userIds && data.userIds.length > 0) {
        this.logger.log(`[EventPattern] Creating notification for multiple users: ${data.userIds.length} users`)
        const notificationPromises = data.userIds.map(userId => {
          const userData = {
            ...data,
            userId
          }
          return this.notificationService.createNotification(userData)
        })

        try {
          const notifications = await Promise.all(notificationPromises)
          this.logger.log(`[EventPattern] Created ${notifications.length} notifications successfully`)
          result = { success: true, data: notifications }
        } catch (multiUserError) {
          this.logger.error(`[EventPattern] Error creating notifications for multiple users: ${multiUserError.message}`)
          result = { success: false, message: multiUserError.message }
        }
      }
      // For single user notification (traditional flow)
      else {
        this.logger.log(`[EventPattern] Calling notification service to create notification for user: ${data.userId}`)

        try {
          const notification = await this.notificationService.createNotification(data)

          // Log after createNotification  
          this.logger.log(`[EventPattern] Notification created successfully with ID: ${notification.id}`)
          this.logger.log(`[EventPattern] Full notification details: ${JSON.stringify(notification)}`)

          result = { success: true, data: notification }
        } catch (serviceError) {
          this.logger.error(`[EventPattern] Service error creating notification: ${serviceError.message}`, serviceError.stack)
          this.logger.error(`[EventPattern] Error details: ${JSON.stringify(serviceError)}`)
          result = { success: false, message: serviceError.message }
        }
      }

      // Giải phóng key khi hoàn thành
      this.notificationService.completeNotificationProcessing(notificationKey)
      return result
    } catch (error) {
      // Giải phóng key nếu có lỗi
      this.notificationService.completeNotificationProcessing(notificationKey)
      this.logger.error(`[EventPattern] Error creating notification: ${error.message}`, error.stack)
      return { success: false, message: error.message }
    }
  }

  // IMPORTANT: MessagePattern handler bị vô hiệu hóa để tránh trùng lặp
  // Chúng ta vẫn giữ code nhưng đổi tên pattern để không nhận message
  @MessagePattern('notification.create.disabled')
  async handleCreateNotificationMessage(data: CreateNotificationDto) {
    this.logger.warn(`[MessagePattern] This handler is disabled to prevent duplicate notifications. Using EventPattern instead.`)
    return {
      success: false,
      message: 'This message pattern is disabled. Please use event pattern for creating notifications.'
    }
  }

  @MessagePattern(NOTIFICATIONS_PATTERN.GET_USER_NOTIFICATIONS)
  async handleGetUserNotifications(data: { userId: string }) {
    this.logger.log(`[MessagePattern] Getting notifications for user: ${data.userId}`)
    try {
      const notifications = await this.notificationService.getUserNotifications(data.userId)
      return { success: true, data: notifications }
    } catch (error) {
      this.logger.error(`Error getting user notifications: ${error.message}`)
      return { success: false, message: error.message }
    }
  }

  @MessagePattern(NOTIFICATIONS_PATTERN.MARK_NOTIFICATION_READ)
  async handleMarkNotificationRead(data: MarkNotificationReadDto) {
    this.logger.log(`[MessagePattern] Marking notification as read: ${data.notificationId}`)
    try {
      const notification = await this.notificationService.markAsRead(data.notificationId)
      return { success: true, data: notification }
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`)
      return { success: false, message: error.message }
    }
  }

  @MessagePattern('test_notification')
  async testNotification() {
    this.logger.log('Received test notification request')
    try {
      // Create a test notification
      const testData: CreateNotificationDto = {
        userId: 'test-user-id',
        title: 'Test Notification',
        content: 'This is a test notification to verify database access',
        type: NotificationType.SYSTEM,
        link: '/test'
      }

      this.logger.log(`Creating test notification with data: ${JSON.stringify(testData)}`)

      const result = await this.notificationService.createNotification(testData)
      this.logger.log(`Test notification created successfully: ${JSON.stringify(result)}`)

      return {
        success: true,
        message: 'Test notification created successfully',
        data: result
      }
    } catch (error) {
      this.logger.error(`Failed to create test notification: ${error.message}`, error.stack)
      return {
        success: false,
        message: `Failed to create test notification: ${error.message}`,
        error: JSON.stringify(error)
      }
    }
  }

  @MessagePattern(NOTIFICATIONS_PATTERN.STREAM_NOTIFICATIONS)
  streamNotifications(data: { userId: string }): Observable<MessageEvent> {
    this.logger.log(`[MessagePattern] Creating notification stream for user: ${data.userId}`)

    // Ủy quyền việc tạo stream cho NotificationService
    return this.notificationService.createNotificationStream(data.userId)
  }
}
