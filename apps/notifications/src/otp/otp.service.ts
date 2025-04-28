// otp.service.ts
import { Injectable, Inject } from '@nestjs/common'
import { RedisClientType } from 'redis'
import { EmailService } from '../email/email.service'
import { RpcException } from '@nestjs/microservices'

@Injectable()
export class OtpService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    private readonly emailService: EmailService
  ) { }

  async createOTP(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Lưu OTP vào Redis với TTL 5 phút
    await this.redisClient.setEx(`otp:${email}`, 300, otp)

    // Gửi OTP qua email
    await this.emailService.sendOtp(email, otp)
    return otp
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const storedOtp = await this.redisClient.get(`otp:${email}`)

    if (!storedOtp || storedOtp !== otp) {
      throw new RpcException({
        statusCode: 400,
        message: 'Mã OTP không hợp lệ!',
      })
    }

    // Xóa OTP sau khi xác thực thành công
    await this.redisClient.del(`otp:${email}`)
    return true
  }
}
