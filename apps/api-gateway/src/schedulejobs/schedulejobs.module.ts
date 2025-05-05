import { Module } from '@nestjs/common'


import {
  ClientProxyFactory,
  ClientOptions,
  Transport,
} from '@nestjs/microservices'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { schedulejobsService } from './schedulejobs.service'
import { SCHEDULE_CLIENT } from '../constraints'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { ScheduleJobsController } from './schedulejobs.controller'

@Module({
  imports: [ClientConfigModule, ConfigModule],
  providers: [
    schedulejobsService,
    PassportModule,

    {
      provide: SCHEDULE_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.SchedulesClientOptions // Getting the client options
        return ClientProxyFactory.create(clientOptions) // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
  ],
  controllers: [ScheduleJobsController],
})
export class schedulejobsModule { }
