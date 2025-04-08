import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PrismaModule } from '../prisma/prisma.module'
import { ScheduleJobController } from './schedulejob.controller'
import { ScheduleJobsService } from './schedulejob.service'

const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT'
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'
@Module({
  imports: [PrismaModule,
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
      {
        name: BUILDINGS_CLIENT,
        useFactory: (configService: ConfigService) => {
          const user = configService.get('RABBITMQ_USER')
          const password = configService.get('RABBITMQ_PASSWORD')
          const host = configService.get('RABBITMQ_HOST')
          const isLocal = process.env.NODE_ENV !== 'production'
          return {
            transport: Transport.RMQ,
            options: {
              urls: isLocal
                ? [`amqp://${user}:${password}@${host}`]
                : [`amqp://${user}:${password}@rabbitmq:5672`],
              queue: 'buildings_queue',
              queueOptions: {
                durable: true,
                prefetchCount: 1,
              },
            },
          }
        },
        inject: [ConfigService],
      },
    ]),

  ],
  controllers: [ScheduleJobController],
  providers: [
    ScheduleJobsService,
  ],
})
export class ScheduleJobModule { }
