import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

const TASK_CLIENT = 'TASK_CLIENT';
const CRACK_CLIENT = 'CRACK_CLIENT';
const USERS_CLIENT = 'USERS_CLIENT';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: TASK_CLIENT,
                useFactory: (configService: ConfigService) => {
                    const user = configService.get('RABBITMQ_USER');
                    const password = configService.get('RABBITMQ_PASSWORD');
                    const host = configService.get('RABBITMQ_HOST');
                    const isLocal = process.env.NODE_ENV !== 'production';
                    return {
                        transport: Transport.RMQ,
                        options: {
                            urls: isLocal
                                ? [`amqp://${user}:${password}@${host}`]
                                : [`amqp://${user}:${password}@rabbitmq:5672`],
                            queue: 'tasks_queue',
                            queueOptions: {
                                durable: true,
                                prefetchCount: 1,
                            },
                        },
                    };
                },
                inject: [ConfigService],
            },
            {
                name: CRACK_CLIENT,
                useFactory: (configService: ConfigService) => {
                    const user = configService.get('RABBITMQ_USER');
                    const password = configService.get('RABBITMQ_PASSWORD');
                    const host = configService.get('RABBITMQ_HOST');
                    const isLocal = process.env.NODE_ENV !== 'production';
                    return {
                        transport: Transport.RMQ,
                        options: {
                            urls: isLocal
                                ? [`amqp://${user}:${password}@${host}`]
                                : [`amqp://${user}:${password}@rabbitmq:5672`],
                            queue: 'cracks_queue',
                            queueOptions: {
                                durable: true,
                                prefetchCount: 1,
                            },
                        },
                    };
                },
                inject: [ConfigService],
            },
            {
                name: USERS_CLIENT,
                useFactory: (configService: ConfigService) => {
                    const isLocal = process.env.NODE_ENV !== 'production';
                    const usersHost = isLocal
                        ? configService.get('USERS_SERVICE_HOST', 'localhost')
                        : 'users_service';
                    const usersPort = configService.get('USERS_SERVICE_PORT', '3001');

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
                    };
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