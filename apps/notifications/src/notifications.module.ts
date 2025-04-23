import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { Module, Logger, OnModuleInit } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { OtpService } from './otp/otp.service'
import { EmailService } from './email/email.service'
import { RedisModule } from './redis/redis.module'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { join } from 'path'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MailerModule } from '@nestjs-modules/mailer'
import { NotificationModule } from './notification/notification.module'

@Module({
  imports: [
    RedisModule,
    ClientConfigModule,
    NotificationModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Get template directory from environment variable or use default
        const templateDir = configService.get<string>('EMAIL_TEMPLATE_DIR') ||
          join(process.cwd(), 'libs/contracts/src/notifications/templates')
        return {
          transport: {
            service: 'gmail', // Use Gmail service
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
  providers: [
    OtpService,
    EmailService,
    {
      provide: 'APP_INIT_LOGGER',
      useFactory: () => {
        const logger = new Logger('NotificationsApp');
        logger.log('Notifications microservice initializing...');
        logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.log(`Database URL defined: ${process.env.DB_NOTIFICATION_SERVICE ? 'Yes' : 'No'}`);
        logger.log(`Redis URL defined: ${process.env.REDIS_URL ? 'Yes' : 'No'}`);
        return logger;
      }
    }
  ],
  exports: [OtpService, EmailService],
})
export class NotificationsModule { }
