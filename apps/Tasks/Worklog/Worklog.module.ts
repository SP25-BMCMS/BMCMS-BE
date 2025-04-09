import { Module } from '@nestjs/common';
import { WorkLogController } from './Worklog.controller';
import { WorkLogService } from './Worklog.service';
import { PrismaModule } from '../../users/prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

const CRACKS_CLIENT = 'CRACKS_CLIENT';

@Module({
  imports: [PrismaModule,
    ClientsModule.registerAsync([
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
    ]),
  ],
  controllers: [WorkLogController],
  providers: [WorkLogService],
})
export class WorkLogModule { }
