import { Module } from '@nestjs/common';
import { ScheduleJobsService as schedulejobsService } from './schedulejob.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleJobController } from './schedulejob.controller';

@Module({
  imports: [PrismaModule],
  providers: [schedulejobsService],
  controllers: [ScheduleJobController],
})
export class schedulejobsModule {}
