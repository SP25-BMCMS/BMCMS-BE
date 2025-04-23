import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { NOTIFICATION_CLIENT } from '../constraints'

@Module({
  imports: [
    ClientConfigModule,
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => {
          const redisUrl = configService.get<string>('REDIS_URL')
          if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is not set')
          }

          const url = new URL(redisUrl)
          return {
            transport: Transport.REDIS,
            options: {
              host: url.hostname,
              port: parseInt(url.port),
              username: url.username,
              password: url.password,
              retryAttempts: 5,
              retryDelay: 3000,
              tls: {
                rejectUnauthorized: false
              }
            },
          }
        },
      },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [PassportModule],
})
export class NotificationsModule { }
