import { Controller, Get, Logger } from '@nestjs/common'
import { EventPattern, MessagePattern } from '@nestjs/microservices'
import { OtpService } from './otp/otp.service'
import { EmailService } from './email/email.service'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly otpService: OtpService, private readonly emailService: EmailService) { }

  @EventPattern('send_otp')
  async handleSendOtp(data: { email: string }) {
    return await this.otpService.createOTP(data.email)
  }

  @EventPattern('send_otp_message')
  async handleSendOtpMessage(data: { email: string }) {
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
}
