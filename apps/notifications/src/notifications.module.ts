import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { OtpService } from './otp/otp.service'
import { EmailService } from './email/email.service'
import { RedisModule } from './redis/redis.module'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { join } from 'path'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MailerModule } from '@nestjs-modules/mailer'

@Module({
  imports: [RedisModule, ClientConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Get template directory from environment variable or use default
        const templateDir = configService.get<string>('EMAIL_TEMPLATE_DIR') ||
          join(process.cwd(), 'libs/contracts/src/notifications/templates')

        console.log('Using email template directory:', templateDir)

        return {
          transport: {
            host: configService.get<string>('EMAIL_HOST'),
            port: configService.get<number>('EMAIL_PORT'),
            secure: false,
            auth: {
              user: configService.get<string>('EMAIL_USER'),
              pass: configService.get<string>('EMAIL_PASSWORD'),
            },
          },
          defaults: {
            from: `"No Reply" <${configService.get<string>('EMAIL_FROM')}>`,
          },
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        }
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [OtpService, EmailService],
  exports: [OtpService, EmailService],
})
export class NotificationsModule { }
