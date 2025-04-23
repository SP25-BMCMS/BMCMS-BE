import { Module } from '@nestjs/common'
import { JwtConfigModule } from 'apps/configs/jwt-config.module'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'

const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT'

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [UsersModule, JwtConfigModule,
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_CLIENT,
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
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [AuthService, ClientsModule],
})
export class AuthModule { }
