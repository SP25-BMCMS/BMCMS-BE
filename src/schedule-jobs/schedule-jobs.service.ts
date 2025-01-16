import { Injectable } from '@nestjs/common';
import { CreateScheduleJobDto } from './dto/create-schedule-job.dto';
import { UpdateScheduleJobDto } from './dto/update-schedule-job.dto';

@Injectable()
export class ScheduleJobsService {
  create(createScheduleJobDto: CreateScheduleJobDto) {
    return 'This action adds a new scheduleJob';
  }

  findAll() {
    return `This action returns all scheduleJobs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} scheduleJob`;
  }

  update(id: number, updateScheduleJobDto: UpdateScheduleJobDto) {
    return `This action updates a #${id} scheduleJob`;
  }

  remove(id: number) {
    return `This action removes a #${id} scheduleJob`;
  }
}
