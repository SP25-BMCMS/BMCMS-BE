import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleService } from './Schedules.service';
import { ScheduleController } from './Schedules.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Định nghĩa constants cho microservice clients
const TASK_CLIENT = 'TASK_CLIENT';
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';

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
    ]),
  ],
  providers: [ScheduleService],
  controllers: [ScheduleController],
})
export class SchedulesModule { }
