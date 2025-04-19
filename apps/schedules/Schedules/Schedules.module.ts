import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleService } from './Schedules.service';
import { ScheduleController } from './Schedules.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Định nghĩa constants cho microservice clients
const TASK_CLIENT = 'TASK_CLIENT';
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';
const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: TASK_CLIENT,
        useFactory: (configService: ConfigService) => {
          const rabbitUrl = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitUrl],
              queue: 'tasks_queue',
              queueOptions: {
                durable: true,
                prefetchCount: 1,
              },
            },
          }
        },
        inject: [ConfigService],
      },
      {
        name: BUILDINGS_CLIENT,
        useFactory: (configService: ConfigService) => {
          const rabbitUrl = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitUrl],
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
  providers: [ScheduleService],
  controllers: [ScheduleController],
})
export class SchedulesModule { }
