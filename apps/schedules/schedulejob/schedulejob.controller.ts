import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { TASKS_PATTERN } from '../../../libs/contracts/src/tasks/task.patterns';
import { INSPECTIONS_PATTERN } from '../../../libs/contracts/src/inspections/inspection.patterns';
import { ScheduleJobsService } from './schedulejob.service';
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto';
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status';
import { SCHEDULEJOB_PATTERN } from '@app/contracts/schedulesjob/ScheduleJob.patterns';
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto';
import { PaginationParams, PaginationResponseDto } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Controller('schedule-jobs')
export class ScheduleJobController {
  constructor(private readonly ScheduleJobsService: ScheduleJobsService) {}

  @MessagePattern(SCHEDULEJOB_PATTERN.CREATE) 
  async createScheduleJob(
    @Payload() createScheduleJobDto: CreateScheduleJobDto
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    return this.ScheduleJobsService.createScheduleJob(createScheduleJobDto);
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.GET) 
  async getAllScheduleJobs(@Payload() paginationParams: PaginationParams = {}): Promise<PaginationResponseDto<ScheduleJobResponseDto>> {
    return this.ScheduleJobsService.getAllScheduleJobs(paginationParams);
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.GET_BY_ID) 
  async getScheduleJobById(@Payload() payload: { schedule_job_id: string }): Promise<ApiResponse<ScheduleJobResponseDto>> {
    return this.ScheduleJobsService.getScheduleJobById(payload.schedule_job_id);
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.UPDATE_STATUS) 
  async updateScheduleJobStatus(
    @Payload() updateScheduleJobStatusDto: UpdateScheduleJobStatusDto
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    return this.ScheduleJobsService.updateScheduleJobStatus(updateScheduleJobStatusDto);
  }
  @MessagePattern(SCHEDULEJOB_PATTERN.UPDATE)  // Pattern to update a schedule job
  async updateScheduleJob(
    @Payload() payload: { schedule_job_id: string, updateData: Partial<UpdateScheduleJobDto> }
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    return this.ScheduleJobsService.updateScheduleJob(payload.schedule_job_id, payload.updateData);
  }
}