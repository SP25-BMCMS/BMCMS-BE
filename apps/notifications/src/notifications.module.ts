import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { OtpService } from './otp/otp.service'
import { EmailService } from './email/email.service'
import { RedisModule } from './redis/redis.module'
import { ClientConfigModule } from 'apps/configs/client-config.module'


@Module({
  imports: [RedisModule, ClientConfigModule],
  controllers: [NotificationsController],
  providers: [OtpService, EmailService],
  exports: [OtpService, EmailService],
})
export class NotificationsModule { }
