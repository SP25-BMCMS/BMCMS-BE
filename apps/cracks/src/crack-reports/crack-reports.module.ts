import { Module } from '@nestjs/common';
import { CrackReportsService } from './crack-reports.service';
import { CrackReportsController } from './crack-reports.controller';
import { PrismaModule } from '../../prisma/prisma.module'; // Import PrismaModule
import { PrismaService } from '../../prisma/prisma.service'; // Import PrismaService
import { ClientsModule } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { S3UploaderModule } from '../crack-details/s3-uploader.module';

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';

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
    ]),
    S3UploaderModule,
  ],
  controllers: [CrackReportsController],
  providers: [CrackReportsService, PrismaService], // Thêm TASK_SERVICE vào providers
  exports: [CrackReportsService], // Xuất CrackReportsService để các module khác có thể sử dụng
})
export class CrackReportsModule { }
