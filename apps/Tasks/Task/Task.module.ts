import { TaskService } from './Task.service'
import { TasksController } from './Task.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { Module } from '@nestjs/common'
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices'
import { TASK_CLIENT } from 'apps/api-gateway/src/constraints'
import { join } from 'path'
import { TaskAssignmentsService } from '../TaskAssignments/TaskAssignments.service'
import { PrismaService } from '../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'
import { ClientConfigService } from 'apps/configs/client-config.service'

// Define the client token names
const USERS_CLIENT = 'USERS_CLIENT'
const CRACK_CLIENT = 'CRACK_CLIENT'
const SCHEDULE_CLIENT = 'SCHEDULE_CLIENT'

@Module({
  imports: [
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: USERS_CLIENT,
        useFactory: (configService: ConfigService) => {
          const isLocal = process.env.NODE_ENV !== 'production'
          const usersHost = isLocal
            ? configService.get('USERS_SERVICE_HOST', 'localhost')
            : 'users_service'
          const usersPort = configService.get('USERS_SERVICE_PORT', '3001')

          return {
            transport: Transport.GRPC,
            options: {
              url: `${usersHost}:${usersPort}`,
              package: 'users',
              protoPath: join(
                process.cwd(),
                'libs/contracts/src/users/users.proto',
              ),
              loader: {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
              },
            },
          }
        },
        inject: [ConfigService],
      },
      {
        name: CRACK_CLIENT,
        useFactory: (configService: ConfigService) => {
          const rabbitUrl = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitUrl],
              queue: 'cracks_queue',
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
        name: SCHEDULE_CLIENT,
        useFactory: (configService: ConfigService) => {
          const rabbitUrl = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitUrl],
              queue: 'schedules_queue',
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
    ]),
  ],
  providers: [
    TaskService,
    TaskAssignmentsService,
    PrismaService,
  ],
  controllers: [TasksController],
  exports: [TaskService, TaskAssignmentsService, ClientsModule],
})
export class TasksModule { }
