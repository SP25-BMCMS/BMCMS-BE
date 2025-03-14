import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { TASKS_PATTERN } from '../../../libs/contracts/src/tasks/task.patterns';
import { INSPECTIONS_PATTERN } from '../../../libs/contracts/src/inspections/inspection.patterns';
import { InspectionsService } from './schedulejob.service';
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto';
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status';
import { SCHEDULEJOB_PATTERN } from '@app/contracts/schedulesjob/ScheduleJob.patterns';

@Controller('schedule-jobs')
export class ScheduleJobController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @MessagePattern(SCHEDULEJOB_PATTERN.CREATE) 
  async createScheduleJob(
    @Payload() createScheduleJobDto: CreateScheduleJobDto
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    return this.inspectionsService.createScheduleJob(createScheduleJobDto);
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.GET) 
  async getAllScheduleJobs(): Promise<ApiResponse<ScheduleJobResponseDto[]>> {
    return this.inspectionsService.getAllScheduleJobs();
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.GET_BY_ID) 
  async getScheduleJobById(@Payload() payload: { schedule_job_id: string }): Promise<ApiResponse<ScheduleJobResponseDto>> {
    return this.inspectionsService.getScheduleJobById(payload.schedule_job_id);
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.UPDATE_STATUS) 
  async updateScheduleJobStatus(
    @Payload() updateScheduleJobStatusDto: UpdateScheduleJobStatusDto
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    return this.inspectionsService.updateScheduleJobStatus(updateScheduleJobStatusDto);
  }
}