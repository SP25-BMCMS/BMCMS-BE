import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ScheduleJobsService } from './schedule-jobs.service';
import { CreateScheduleJobDto } from './dto/create-schedule-job.dto';
import { UpdateScheduleJobDto } from './dto/update-schedule-job.dto';

@Controller('schedule-jobs')
export class ScheduleJobsController {
  constructor(private readonly scheduleJobsService: ScheduleJobsService) {}

  @Post()
  create(@Body() createScheduleJobDto: CreateScheduleJobDto) {
    return this.scheduleJobsService.create(createScheduleJobDto);
  }

  @Get()
  findAll() {
    return this.scheduleJobsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleJobsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScheduleJobDto: UpdateScheduleJobDto) {
    return this.scheduleJobsService.update(+id, updateScheduleJobDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleJobsService.remove(+id);
  }
}
