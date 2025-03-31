import { Module } from '@nestjs/common'
import { JwtConfigModule } from 'apps/configs/jwt-config.module'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { OtpModule } from '../otp/otp.module'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'

const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT'

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [UsersModule, JwtConfigModule, OtpModule,
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_CLIENT,
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: configService.get<string>('REDIS_HOST') || 'redis',
            port: configService.get<number>('REDIS_PORT') || 6379,
            password: configService.get<string>('REDIS_PASSWORD') || '',
            retryAttempts: 5,
            retryDelay: 3000,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [AuthService, ClientsModule], // 👈 Export ClientsModule để các module khác có thể sử dụng NOTIFICATION_CLIENT
})
export class AuthModule { }
