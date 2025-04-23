import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { SchedulesModule } from '../Schedules/Schedules.module'
import { ScheduleJobModule } from '../schedulejob/schedulejob.module'
import { MaintenanceCycleModule } from '../MaintenanceCycle/MaintenanceCycle.module'
import { MaintenanceCronModule } from '../cron/maintenance-cron.module'
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Đăng ký NestJS Schedule Module để sử dụng cron jobs
    NestScheduleModule.forRoot(),
    ClientConfigModule,
    SchedulesModule,
    ScheduleJobModule,
    MaintenanceCycleModule,
    MaintenanceCronModule,
  ],
  controllers: [],
  providers: [],
})
export class ScheduleModule { }
