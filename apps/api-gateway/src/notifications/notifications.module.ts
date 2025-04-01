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
          return {
            transport: Transport.REDIS,
            options: {
              host: configService.get<string>('REDIS_HOST', 'redis'),
              port: configService.get<number>('REDIS_PORT', 6379),
              password: configService.get<string>('REDIS_PASSWORD', ''),
              retryAttempts: 5,
              retryDelay: 3000,
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
