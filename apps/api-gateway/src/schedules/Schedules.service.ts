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
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
import { firstValueFrom, timeout } from 'rxjs'

// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'
@Injectable()
export class SchedulesService {
  constructor(
    @Inject(SCHEDULE_CLIENT) private readonly scheduleClient: ClientProxy,
  ) { }

  // Create schedule (Microservice)
  async createSchedule(createScheduleDto: CreateScheduleDto): Promise<any> {
    try {
      return await this.scheduleClient.send(
        SCHEDULES_PATTERN.CREATE,
        createScheduleDto,
      )
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating schedule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // Update schedule (Microservice)
  async updateSchedule(
    schedule_id: string,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<any> {
    try {
      console.log('Updating schedule with ID:', schedule_id)
      console.log('Update data:', updateScheduleDto)

      // Validate the schedule_id
      if (!schedule_id) {
        throw new HttpException(
          'Schedule ID is required',
          HttpStatus.BAD_REQUEST,
        )
      }

      // Validate the update data
      if (!updateScheduleDto || Object.keys(updateScheduleDto).length === 0) {
        throw new HttpException(
          'Update data is required',
          HttpStatus.BAD_REQUEST,
        )
      }

      // Fix: Send the data in the structure expected by the microservice controller
      // Add timeout to prevent hanging
      const response = await firstValueFrom(
        this.scheduleClient.send(SCHEDULES_PATTERN.UPDATE, {
          schedule_id,
          updateScheduleDto,
        }).pipe(timeout(10000)) // 10 second timeout
      )

      return response
    } catch (error) {
      console.error('Error updating schedule:', error)

      if (error.name === 'TimeoutError') {
        throw new HttpException(
          'Request timed out. The microservice might be down or not responding.',
          HttpStatus.REQUEST_TIMEOUT,
        )
      } else if (error.status === 404) {
        throw new HttpException(
          error.message || 'Schedule not found',
          HttpStatus.NOT_FOUND,
        )
      } else if (error.status === 400) {
        throw new HttpException(
          error.message || 'Invalid update data',
          HttpStatus.BAD_REQUEST,
        )
      } else {
        throw new HttpException(
          `Error occurred while updating schedule: ${error.message || 'Unknown error'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
  }

  // Change schedule type (Microservice)
  async changeScheduleType(
    schedule_id: string,
    schedule_type: $Enums.ScheduleType,
  ): Promise<any> {
    try {
      return await this.scheduleClient.send(SCHEDULES_PATTERN.UPDATE_TYPE, {
        schedule_id,
        schedule_type,
      })
    } catch (error) {
      throw new HttpException(
        'Error occurred while changing schedule type',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  // Get schedule by ID (Microservice)
  async getScheduleById(schedule_id: string): Promise<any> {
    console.log(
      '🚀 ~ SchedulesService ~ getScheduleById ~ schedule_id:',
      schedule_id,
    )
    try {
      return await this.scheduleClient.send(
        SCHEDULES_PATTERN.GET_BY_ID,
        schedule_id,
      )
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching schedule by ID',
        HttpStatus.NOT_FOUND,
      )
    }
  }

  // Get all schedules (Microservice)
  async getAllSchedules(paginationParams: PaginationParams = {}): Promise<any> {
    try {
      return await this.scheduleClient.send(
        SCHEDULES_PATTERN.GET,
        paginationParams,
      )
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching all schedules',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // Get schedules by status (Microservice)
  // async getSchedulesByStatus(status: string): Promise<any> {
  //   try {
  //     return await this.scheduleClient.send(SCHEDULES_PATTERN.GET_BY_STATUS, { status });
  //   } catch (error) {
  //     throw new HttpException(
  //       'Error occurred while fetching schedules by status',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // Example of a task-related service (Microservice)
  async getTaskByScheduleId(schedule_assignment_id: string): Promise<any> {
    try {
      return await this.scheduleClient.send(SCHEDULES_PATTERN.GET_BY_ID, {
        schedule_assignment_id,
      })
    } catch (error) {
      throw new HttpException(
        'Task not found for the given schedule assignment ID = ' +
        schedule_assignment_id,
        HttpStatus.NOT_FOUND,
      )
    }
  }
}
