import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport, GrpcOptions } from '@nestjs/microservices';
import { UsersController } from './users.controller';
import { ConfigService } from '@nestjs/config';

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';
const CRACKS_CLIENT = 'CRACKS_CLIENT';
const TASKS_CLIENT = 'TASKS_CLIENT';


@Module({
  imports: [
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: BUILDINGS_CLIENT,
        useFactory: (configService: ConfigService) => {
          const user = configService.get('RABBITMQ_USER')
          const password = configService.get('RABBITMQ_PASSWORD')
          const host = configService.get('RABBITMQ_HOST')
          const isLocal = process.env.NODE_ENV !== 'production'
          return {
            transport: Transport.RMQ,
            options: {
              urls: isLocal
                ? [`amqp://${user}:${password}@${host}`]
                : [`amqp://${user}:${password}@rabbitmq:5672`],
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
        name: CRACKS_CLIENT,
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
        name: TASKS_CLIENT,
        useFactory: (configService: ConfigService) => {
          const user = configService.get('RABBITMQ_USER')
          const password = configService.get('RABBITMQ_PASSWORD')
          const host = configService.get('RABBITMQ_HOST')
          const isLocal = process.env.NODE_ENV !== 'production'
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
          }
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
