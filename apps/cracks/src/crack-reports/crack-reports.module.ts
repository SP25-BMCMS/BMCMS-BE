import { Module } from '@nestjs/common';
import { CrackReportsService } from './crack-reports.service';
import { CrackReportsController } from './crack-reports.controller';
import { PrismaModule } from '../../prisma/prisma.module'; // Import PrismaModule
import { PrismaService } from '../../prisma/prisma.service'; // Import PrismaService
import { ClientsModule } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: 'TASK_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [`amqp://${configService.get('RABBITMQ_USER')}:${configService.get('RABBITMQ_PASSWORD')}@${configService.get('RABBITMQ_HOST')}`],
            queue: configService.get('RABBITMQ_QUEUE_NAME'),
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [CrackReportsController],
  providers: [CrackReportsService, PrismaService], // Thêm TASK_SERVICE vào providers
  exports: [CrackReportsService], // Xuất CrackReportsService để các module khác có thể sử dụng
})
export class CrackReportsModule { }
