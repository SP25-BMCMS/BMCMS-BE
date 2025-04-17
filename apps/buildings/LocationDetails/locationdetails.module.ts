import { Module } from '@nestjs/common';
import { LocationDetailService } from './locationdetails.service';
import { LocationDetailsController } from './locationdetails.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
  providers: [LocationDetailService],
  controllers: [LocationDetailsController],
  exports: [LocationDetailService],
})
export class LocationDetailsModule {}
