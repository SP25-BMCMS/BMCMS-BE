import { Module } from '@nestjs/common';
import { CrackRecordService } from './CrackRecord.service';
import { CrackRecordController } from './CrackRecord.controller';
import { PrismaModule } from 'apps/buildings/prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'TASK_CLIENT',
        useFactory: (configService: ConfigService) => {
          const url = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
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
  controllers: [CrackRecordController],
  providers: [CrackRecordService],
  exports: [CrackRecordService],
})
export class CrackRecordModule {} 