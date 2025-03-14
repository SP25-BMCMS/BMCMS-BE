import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { schedulejobsService } from './schedulejobs.service';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status';
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto';
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto';
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto';
@Controller('schedule-jobs')
export class ScheduleJobsController {
  constructor(private readonly scheduleJobsService: schedulejobsService) {}

  @Put('status/:schedule_job_id')
  async updateScheduleJobStatus(
    @Param('schedule_job_id') schedule_job_id: string,
    @Body() updateScheduleJobStatusDto: UpdateScheduleJobStatusDto,
  ): Promise<ApiResponse<any>> {
    return this.scheduleJobsService.updateScheduleJobStatus(schedule_job_id,updateScheduleJobStatusDto);
  }

  @Get()
  async getAllScheduleJobs(): Promise<ApiResponse<any>> {
    return this.scheduleJobsService.getAllScheduleJobs();
  }

  @Get(':schedule_job_id')
  async getScheduleJobById(@Param('schedule_job_id') schedule_job_id: string): Promise<ApiResponse<any>> {
    return this.scheduleJobsService.getScheduleJobById(schedule_job_id);
  }

  @Post()
  async createScheduleJob(@Body() createScheduleJobDto: CreateScheduleJobDto): Promise<ApiResponse<any>> {
    return this.scheduleJobsService.createScheduleJob(createScheduleJobDto);
  }
  @Put(':schedule_job_id')
  async updateScheduleJob(
    @Param('schedule_job_id') schedule_job_id: string,  
    @Body() updateScheduleJobDto: UpdateScheduleJobDto 
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    const response = await this.scheduleJobsService.updateScheduleJob(schedule_job_id, updateScheduleJobDto);
    return response;
  }
}