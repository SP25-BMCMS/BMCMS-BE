import { Controller, Get } from '@nestjs/common'
import { EventPattern } from '@nestjs/microservices'
import { OtpService } from './otp/otp.service'
import { EmailService } from './email/email.service'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'

@Controller()
export class NotificationsController {
  constructor(private readonly otpService: OtpService, private readonly emailService: EmailService) { }

  @EventPattern('send_otp')
  async handleSendOtp(data: { email: string }) {
    return await this.otpService.createOTP(data.email)
  }

  @EventPattern('verify_otp')
  async handleVerifyOtp(data: { email: string; otp: string }) {
    return this.otpService.verifyOTP(data.email, data.otp)
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
    console.log('Received maintenance email request:', data)
    const result = await this.emailService.sendMaintenanceEmail(data)
    if (!result) {
      console.error('Failed to send maintenance email to:', data.to)
    }
  }
}
