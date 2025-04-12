import { Module } from '@nestjs/common'
import { WorkLogController } from './Worklog.controller'
import { WorkLogService } from './Worklog.service'
import { PrismaModule } from '../../users/prisma/prisma.module'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'

const CRACKS_CLIENT = 'CRACKS_CLIENT'

@Module({
  imports: [PrismaModule,
    ClientsModule.registerAsync([
      {
        name: CRACKS_CLIENT,
        useFactory: (configService: ConfigService) => {
          const url = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue: 'cracks_queue',
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
  controllers: [WorkLogController],
  providers: [WorkLogService],
})
export class WorkLogModule { }
