import { Controller, Get } from '@nestjs/common'
import { EventPattern } from '@nestjs/microservices'
import { OtpService } from './otp/otp.service'
import { EmailService } from './email/email.service'

@Controller()
export class NotificationsController {
  constructor(private readonly otpService: OtpService, private readonly emailService: EmailService) { }

  @EventPattern('send_otp')
  async handleSendOtp(data: { email: string }) {
    console.log("🚀 Kha ne ~ email:", data)
    const otp = await this.otpService.createOTP(data.email)
    return this.emailService.sendOtp(data.email, otp)
  }

  @EventPattern('verify_otp')
  async handleVerifyOtp(data: { email: string; otp: string }) {
    console.log("🚀 Kha ne ~ data:", data)

    return this.otpService.verifyOTP(data.email, data.otp)
  }
}
