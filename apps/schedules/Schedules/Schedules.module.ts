import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleService } from './Schedules.service';
import { ScheduleController } from './Schedules.controller';

@Module({
  imports: [PrismaModule],
  providers: [ScheduleService],
  controllers: [ScheduleController],
})
export class SchedulesModule {}
