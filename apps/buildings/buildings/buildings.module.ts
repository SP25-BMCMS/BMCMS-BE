import { Module } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: BUILDINGS_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@rabbitmq:5672'],
          queue: 'buildings_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [BuildingsService],
  controllers: [BuildingsController],
  exports: [BuildingsService],
})
export class BuildingsModule {}
