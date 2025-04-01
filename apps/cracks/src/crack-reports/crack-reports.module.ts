import { Module } from '@nestjs/common';
import { CrackReportsService } from './crack-reports.service';
import { CrackReportsController } from './crack-reports.controller';
import { PrismaModule } from '../../prisma/prisma.module'; // Import PrismaModule
import { PrismaService } from '../../prisma/prisma.service'; // Import PrismaService
import { ClientsModule } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { S3UploaderModule } from '../crack-details/s3-uploader.module';
import { join } from 'path';

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';
const USERS_CLIENT = 'USERS_CLIENT';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: 'TASK_SERVICE',
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
        name: BUILDINGS_CLIENT,
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
            : 'users-service';
          const usersPort = configService.get('USERS_SERVICE_PORT', '5000');

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
    ]),
    S3UploaderModule,
  ],
  controllers: [CrackReportsController],
  providers: [CrackReportsService, PrismaService],
  exports: [CrackReportsService],
})
export class CrackReportsModule { }