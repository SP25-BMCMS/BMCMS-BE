import { Module } from '@nestjs/common'
import { InspectionsService } from './Inspections.service'
import { InspectionsController } from './Inspections.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { join } from 'path'
import { TASK_CLIENT } from '../../../apps/api-gateway/src/constraints'
import { TaskAssignmentsModule } from '../TaskAssignments/TaskAssignments.module'
import { TasksModule } from '../Task/Task.module'

const USERS_CLIENT = 'USERS_CLIENT'
const CRACK_CLIENT = 'CRACK_CLIENT'
const SCHEDULE_CLIENT = 'SCHEDULE_CLIENT'
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ClientConfigModule,
    TaskAssignmentsModule,
    TasksModule,
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
              maxSendMessageLength: 10 * 1024 * 1024, // 10MB
              maxReceiveMessageLength: 10 * 1024 * 1024, // 10MB
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
    InspectionsService,
    {
      provide: 'CRACK_CLIENT',
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.cracksClientOptions
        return ClientProxyFactory.create(clientOptions)
      },
      inject: [ClientConfigService],
    },
    {
      provide: TASK_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.TasksClientOptions
        return ClientProxyFactory.create(clientOptions)
      },
      inject: [ClientConfigService],
    },
  ],
  controllers: [InspectionsController],
  exports: [InspectionsService],
})
export class InspectionsModule { }
