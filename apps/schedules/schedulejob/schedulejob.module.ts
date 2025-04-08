import { Module } from '@nestjs/common'
import { ScheduleJobController } from './schedulejob.controller'
import { ScheduleJobsService } from './schedulejob.service'
import { PrismaService } from '../prisma/prisma.service'
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices'
import { ClientConfigService } from '../../configs/client-config.service'
import { ClientConfigModule } from '../../configs/client-config.module'
import { ConfigService } from '@nestjs/config'
import { BUILDING_CLIENT } from 'apps/api-gateway/src/constraints'

const TASK_CLIENT = 'TASK_CLIENT'

@Module({
  imports: [ClientConfigModule,
    ClientsModule.registerAsync([{
      name: TASK_CLIENT,
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
    },])
  ],
  controllers: [ScheduleJobController],
  providers: [
    ScheduleJobsService,
    PrismaService,
    {
      provide: BUILDING_CLIENT,
      useFactory: (clientConfigService: ClientConfigService) => {
        return ClientProxyFactory.create(clientConfigService.buildingsClientOptions)
      },
      inject: [ClientConfigService],
    },
  ],
})
export class ScheduleJobModule { }
