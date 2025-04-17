import { Module } from '@nestjs/common';
import { MaintenanceCronService } from './maintenance-cron.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';
const TASK_CLIENT = 'TASK_CLIENT';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: NOTIFICATION_CLIENT,
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBITMQ_URL')],
                        queue: configService.get<string>('NOTIFICATION_QUEUE'),
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
            {
                name: BUILDINGS_CLIENT,
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBITMQ_URL')],
                        queue: configService.get<string>('BUILDINGS_QUEUE'),
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
            {
                name: TASK_CLIENT,
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBITMQ_URL')],
                        queue: configService.get<string>('TASK_QUEUE'),
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    providers: [MaintenanceCronService, PrismaService],
    exports: [MaintenanceCronService],
})
export class MaintenanceCronModule { } 