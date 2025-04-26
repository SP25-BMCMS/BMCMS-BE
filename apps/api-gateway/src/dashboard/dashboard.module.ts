import { Module } from '@nestjs/common'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { join } from 'path'

const TASK_CLIENT = 'TASK_CLIENT'
const CRACK_CLIENT = 'CRACK_CLIENT'
const USERS_CLIENT = 'USERS_CLIENT'
const BUILDING_CLIENT = 'BUILDINGS_CLIENT'
const SCHEDULE_CLIENT = 'SCHEDULE_CLIENT'

@Module({
    imports: [
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
                name: BUILDING_CLIENT,
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
        ])
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService]
})
export class DashboardModule { } 