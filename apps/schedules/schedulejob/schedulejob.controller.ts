import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto'
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto'
import { SCHEDULEJOB_PATTERN } from '@app/contracts/schedulesjob/ScheduleJob.patterns'
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status'
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto'
import { Controller, Param } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { ApiTags } from '@nestjs/swagger'
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto'
import { ScheduleJobsService } from './schedulejob.service'

@ApiTags('Schedule Jobs')
@Controller('schedule-jobs')
export class ScheduleJobController {
  constructor(private readonly ScheduleJobsService: ScheduleJobsService) { }

  @MessagePattern(SCHEDULEJOB_PATTERN.CREATE)
  async createScheduleJob(
    @Payload() createScheduleJobDto: CreateScheduleJobDto,
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    return this.ScheduleJobsService.createScheduleJob(createScheduleJobDto)
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.GET)
  async getAllScheduleJobs(
    @Payload() paginationParams: PaginationParams = {},
  ): Promise<PaginationResponseDto<ScheduleJobResponseDto>> {
    return this.ScheduleJobsService.getAllScheduleJobs(paginationParams)
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.GET_BY_ID)
  async getScheduleJobById(
    @Payload() payload: { schedule_job_id: string },
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    console.log('paypayloadpayloadpayloadpayloadpayloadpayloadpayloadload', payload.schedule_job_id)
    return this.ScheduleJobsService.getScheduleJobById(payload.schedule_job_id)
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.UPDATE_STATUS)
  async updateScheduleJobStatus(
    @Payload() updateScheduleJobStatusDto: UpdateScheduleJobStatusDto,
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    console.log('🚀 ~ ScheduleJobController ~ updateScheduleJobStatus ~ updateScheduleJobStatusDto:', updateScheduleJobStatusDto)
    return this.ScheduleJobsService.updateScheduleJobStatus(
      updateScheduleJobStatusDto,
    )
  }
  @MessagePattern(SCHEDULEJOB_PATTERN.UPDATE) // Pattern to update a schedule job
  async updateScheduleJob(
    @Payload()
    payload: {
      schedule_job_id: string
      updateData: Partial<UpdateScheduleJobDto>
    },
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    return this.ScheduleJobsService.updateScheduleJob(
      payload.schedule_job_id,
      payload.updateData,
    )
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.GET_BY_SCHEDULE_ID)
  async getScheduleJobsByScheduleId(data: { scheduleId: string; paginationParams: PaginationParams }) {
    return this.ScheduleJobsService.getScheduleJobsByScheduleId(data.scheduleId, data.paginationParams)
  }

  @MessagePattern(SCHEDULEJOB_PATTERN.SEND_MAINTENANCE_EMAIL)
  async sendMaintenanceEmail(data: { scheduleJobId: string }) {
    return this.ScheduleJobsService.sendMaintenanceEmail(data.scheduleJobId)
  }

  // @MessagePattern(SCHEDULEJOB_PATTERN.CHANGE_STATUS)
  // async changeStatus(
  //   @Payload() payload: { schedule_job_id: string; status: string },
  // ): Promise<ApiResponse<ScheduleJobResponseDto>> {
  //   console.log('🚀 ~ ScheduleJobController ~ changeStatus ~ payload:', payload)
  //   return this.ScheduleJobsService.changeStatus(payload.schedule_job_id, payload.status)
  // }
}
