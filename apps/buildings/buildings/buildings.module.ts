import { Module } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [
        PrismaModule,
        ClientsModule.registerAsync([
            {
                name: 'USERS_CLIENT',
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: ['amqp://admin:admin@rabbitmq:5672'],
                        queue: 'buildings_queue',
                        queueOptions: {
                            durable: true,
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    providers: [BuildingsService],
    controllers: [BuildingsController]
})
export class BuildingsModule { }
