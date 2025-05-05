import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto'
import { SCHEDULEJOB_PATTERN } from '@app/contracts/schedulesjob/ScheduleJob.patterns'
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status'
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto'
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto'
import { firstValueFrom } from 'rxjs'
import { SCHEDULE_CLIENT } from '../constraints'
import { RpcException } from '@nestjs/microservices'

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

  async sendMaintenanceEmail(scheduleJobId: string): Promise<ApiResponse<any>> {
    try {
      const response = await firstValueFrom(
        this.scheduleJobClient.send(SCHEDULEJOB_PATTERN.SEND_MAINTENANCE_EMAIL, { scheduleJobId })
      )
      return response
    } catch (error) {
      console.error('Error sending maintenance email:', error)
      return new ApiResponse(
        false,
        'Failed to send maintenance schedule emails',
        null
      )
    }
  }

  async getScheduleJobsByManagerId(managerid: string): Promise<ApiResponse<any>> {
    try {
      console.log('Getting schedule jobs by manager ID:', managerid);
      const response = await firstValueFrom(
        this.scheduleJobClient.send(SCHEDULEJOB_PATTERN.GET_BY_MANAGER_ID, { managerid })
      );
      console.log('Response from microservice:', response);
      return response;
    } catch (error) {
      console.error('Error getting schedule jobs by manager ID:', error);
      throw new HttpException(
        'Error occurred while fetching schedule jobs for manager',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async changeStatus(schedule_job_id: string, status: string) {
  //   try {
  //     const response = await firstValueFrom(
  //       this.scheduleJobClient.send(SCHEDULEJOB_PATTERN.CHANGE_STATUS, {
  //         schedule_job_id,
  //         status,
  //       })
  //     )
  //     return response
  //   } catch (error) {
  //     throw new RpcException({
  //       statusCode: 500,
  //       message: 'Error changing schedule job status',
  //     })
  //   }
  // }
}
