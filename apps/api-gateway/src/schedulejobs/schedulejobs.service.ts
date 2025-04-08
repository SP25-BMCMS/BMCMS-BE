import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { SCHEDULE_CLIENT } from '../constraints'
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto'
import { SCHEDULES_PATTERN } from '@app/contracts/schedules/Schedule.patterns'
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules'
import { $Enums } from '@prisma/client-Schedule'
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { SCHEDULEJOB_PATTERN } from '@app/contracts/schedulesjob/ScheduleJob.patterns'
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status'
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto'
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto'
import { firstValueFrom } from 'rxjs'
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto'

// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'
@Injectable()
export class schedulejobsService {
  constructor(
    @Inject(SCHEDULE_CLIENT) private readonly scheduleJobClient: ClientProxy,
  ) { }
  async createScheduleJob(
    createScheduleJobDto: CreateScheduleJobDto,
  ): Promise<any> {
    try {
      return await this.scheduleJobClient.send(
        SCHEDULEJOB_PATTERN.CREATE,
        createScheduleJobDto,
      )
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating schedule job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // Get all Schedule Jobs (Microservice)
  async getAllScheduleJobs(paginationParams?: PaginationParams): Promise<any> {
    try {
      return await this.scheduleJobClient.send(
        SCHEDULEJOB_PATTERN.GET,
        paginationParams || {},
      )
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching all schedule jobs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // Get Schedule Job by ID (Microservice)
  async getScheduleJobById(schedule_job_id: string): Promise<any> {
    try {
      return await this.scheduleJobClient.send(SCHEDULEJOB_PATTERN.GET_BY_ID, {
        schedule_job_id,
      })
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching schedule job by ID',
        HttpStatus.NOT_FOUND,
      )
    }
  }

  // Update Schedule Job Status (Microservice)
  async updateScheduleJobStatus(
    schedulejobs_id: string,
    updateScheduleJobStatusDto: UpdateScheduleJobStatusDto,
  ): Promise<any> {
    try {
      return await this.scheduleJobClient.send(
        SCHEDULEJOB_PATTERN.UPDATE_STATUS,
        {
          schedulejobs_id,
          ...updateScheduleJobStatusDto,
        },
      )
    } catch (error) {
      throw new HttpException(
        'Error occurred while updating schedule job status',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
  async updateScheduleJob(
    schedule_job_id: string,
    updateScheduleJobDto: UpdateScheduleJobDto,
  ): Promise<any> {
    try {
      // Sending the request to the microservice
      return await this.scheduleJobClient.send(SCHEDULEJOB_PATTERN.UPDATE, {
        schedule_job_id,
        updateData: updateScheduleJobDto,
      })
    } catch (error) {
      throw new Error('Failed to update schedule job in microservice')
    }
  }

  async getScheduleJobsByScheduleId(scheduleId: string, paginationParams: PaginationParams) {
    try {
      console.log('Getting schedule jobs by schedule ID:', scheduleId, 'with params:', paginationParams)
      const response = await firstValueFrom(
        this.scheduleJobClient.send(SCHEDULEJOB_PATTERN.GET_BY_SCHEDULE_ID, {
          scheduleId,
          paginationParams,
        })
      )
      console.log('Response from microservice:', response)
      return response
    } catch (error) {
      console.error('Error getting schedule jobs by schedule ID:', error)
      throw error
    }
  }
}
