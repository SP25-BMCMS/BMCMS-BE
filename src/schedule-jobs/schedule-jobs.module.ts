import { Module } from '@nestjs/common';
import { ScheduleJobsService } from './schedule-jobs.service';
import { ScheduleJobsController } from './schedule-jobs.controller';

@Module({
  controllers: [ScheduleJobsController],
  providers: [ScheduleJobsService],
})
export class ScheduleJobsModule {}
