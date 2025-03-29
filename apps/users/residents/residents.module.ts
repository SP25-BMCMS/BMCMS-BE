import { Module } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'BUILDING_CLIENT',
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
              queue: 'buildings_queue',
              queueOptions: {
                durable: true,
              },
              socketOptions: {
                heartbeatIntervalInSeconds: 5,
                reconnectTimeInSeconds: 5,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService],
})
export class ResidentsModule {}
