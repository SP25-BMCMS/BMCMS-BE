import { Module } from '@nestjs/common'
import { ScheduleJobController } from './schedulejob.controller'
import { ScheduleJobsService } from './schedulejob.service'
import { PrismaService } from '../prisma/prisma.service'
import { ClientProxyFactory } from '@nestjs/microservices'
import { BUILDING_CLIENT } from '../../api-gateway/src/constraints'
import { ClientConfigService } from '../../configs/client-config.service'
import { ClientConfigModule } from '../../configs/client-config.module'

@Module({
  imports: [ClientConfigModule],
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
