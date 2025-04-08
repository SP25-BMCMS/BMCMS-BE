import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { SchedulesModule } from '../Schedules/Schedules.module'
import { ScheduleJobModule } from '../schedulejob/schedulejob.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    SchedulesModule,
    ScheduleJobModule,
  ],
  controllers: [],
  providers: [],
})
export class ScheduleModule { }
