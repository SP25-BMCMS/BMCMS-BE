import { Module } from '@nestjs/common'
import { TaskAssignmentsService } from './TaskAssignments.service'
import { TaskAssignmentsController } from './TaskAssignments.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { ClientsModule, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { ConfigService } from '@nestjs/config'
import { join } from 'path'

const USERS_CLIENT = 'USERS_CLIENT'
const TASK_CLIENT = 'TASK_CLIENT'
const CRACK_CLIENT = 'CRACK_CLIENT'
const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT'

@Module({
  imports: [
    PrismaModule,
    ClientConfigModule,
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
        name: TASK_CLIENT,
        useFactory: (configService: ConfigService) => {
          const url = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
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
        name: CRACK_CLIENT,
        useFactory: (configService: ConfigService) => {
          const url = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
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
  providers: [
    TaskAssignmentsService,
    {
      provide: 'CRACK_CLIENT',
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.cracksClientOptions
        return ClientProxyFactory.create(clientOptions)
      },
      inject: [ClientConfigService],
    },
  ],
  controllers: [TaskAssignmentsController],
  exports: [TaskAssignmentsService]
})
export class TaskAssignmentsModule { }