import { Module } from '@nestjs/common';
import { ScheduleJobsController } from './schedule-jobs.controller';
import { ScheduleJobsService } from './schedule-jobs.service';

@Module({
  controllers: [ScheduleJobsController],
  providers: [ScheduleJobsService]
})
export class ScheduleJobsModule {}
