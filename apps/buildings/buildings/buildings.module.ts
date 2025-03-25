import { Module } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
    imports: [
        PrismaModule,
        ClientsModule.register([
            {
                name: 'USERS_CLIENT',
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.RABBIT_MQ_URI || 'amqp://localhost:5672'],
                    queue: 'users_queue',
                    queueOptions: {
                        durable: false
                    },
                },
            },
        ]),
    ],
    providers: [BuildingsService],
    controllers: [BuildingsController]
})
export class BuildingsModule {}
