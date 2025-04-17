import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  Param,
  Optional
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { SCHEDULE_CLIENT } from '../constraints'
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto'
import { SCHEDULES_PATTERN } from '@app/contracts/schedules/Schedule.patterns'
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules'
import { $Enums } from '@prisma/client-schedule'
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
import { firstValueFrom, timeout, catchError, of } from 'rxjs'
import { AutoMaintenanceScheduleDto } from '@app/contracts/schedules/auto-maintenance-schedule.dto'
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns'

// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'
@Injectable()
export class SchedulesService {
  // Optional buildings client for direct building service communication
  private readonly buildingsClient?: ClientProxy;

  constructor(
    @Inject(SCHEDULE_CLIENT) private readonly scheduleClient: ClientProxy,
    @Optional() @Inject('BUILDINGS_CLIENT') buildingsClient?: ClientProxy,
  ) {
    this.buildingsClient = buildingsClient;
  }

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

  // Delete Schedule (Soft Delete)
  async deleteSchedule(schedule_id: string): Promise<any> {
    try {
      // Validate the schedule_id
      if (!schedule_id) {
        throw new HttpException(
          'Schedule ID is required',
          HttpStatus.BAD_REQUEST,
        )
      }

      // Send request to microservice
      const response = await firstValueFrom(
        this.scheduleClient.send(SCHEDULES_PATTERN.DELELTE, schedule_id)
      )

      return response
    } catch (error) {
      console.error('Error deleting schedule:', error)

      if (error.status === 404) {
        throw new HttpException(
          error.message || 'Schedule not found',
          HttpStatus.NOT_FOUND,
        )
      } else {
        throw new HttpException(
          `Error occurred while deleting schedule: ${error.message || 'Unknown error'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
  }

  // Create automated maintenance schedule
  async createAutoMaintenanceSchedule(dto: AutoMaintenanceScheduleDto): Promise<any> {
    try {
      // Basic validation
      if (!dto.buildingDetailIds || dto.buildingDetailIds.length === 0) {
        throw new HttpException(
          'Building detail IDs are required to create a maintenance schedule',
          HttpStatus.BAD_REQUEST
        );
      }

      // Simply pass the request to the microservice without any building validation
      // The microservice will validate building existence
      console.log('Sending auto maintenance schedule request to microservice');
      const response = await firstValueFrom(
        this.scheduleClient
          .send(SCHEDULES_PATTERN.CREATE_AUTO_MAINTENANCE, dto)
          .pipe(timeout(60000)) // 60 second timeout
      );

      return response;
    } catch (error) {
      console.error('Error creating automated maintenance schedule:', error);

      // Handle timeout errors
      if (error.name === 'TimeoutError') {
        throw new HttpException(
          'Request timed out. Kiểm tra xem microservice schedule có đang chạy không và RabbitMQ queue đã được cấu hình đúng.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      // Handle RPC exceptions with status codes
      else if (error.error && error.error.statusCode) {
        const statusCode = error.error.statusCode;
        const message = error.error.message || 'Unknown microservice error';

        let httpStatus: HttpStatus;
        switch (statusCode) {
          case 404:
            httpStatus = HttpStatus.NOT_FOUND;
            break;
          case 400:
            httpStatus = HttpStatus.BAD_REQUEST;
            break;
          case 403:
            httpStatus = HttpStatus.FORBIDDEN;
            break;
          default:
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        throw new HttpException(message, httpStatus);
      }

      // Handle existing HttpExceptions
      else if (error instanceof HttpException) {
        throw error;
      }

      // Handle error with message patterns
      else if (error.message) {
        // Special case for "not found" errors
        if (error.message.includes('not found') ||
          error.message.includes('Not found') ||
          error.message.includes('do not exist')) {
          throw new HttpException(
            error.message,
            HttpStatus.NOT_FOUND
          );
        }

        // Default error
        throw new HttpException(
          `Error occurred while creating automated maintenance schedule: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Default catch-all error
      else {
        throw new HttpException(
          'An unexpected error occurred while creating automated maintenance schedule',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  // Kích hoạt tạo lịch bảo trì tự động
  async triggerAutoMaintenanceSchedule(): Promise<any> {
    try {
      console.log('Triggering automatic maintenance schedule creation');

      // Gửi yêu cầu đến microservice với timeout để tránh treo
      const response = await firstValueFrom(
        this.scheduleClient
          .send(SCHEDULES_PATTERN.TRIGGER_AUTO_MAINTENANCE, {})
          .pipe(timeout(60000)) // Tăng timeout lên 60 giây thay vì 30 giây
      );

      return response;
    } catch (error) {
      console.error('Error triggering automated maintenance schedule creation:', error);

      if (error.name === 'TimeoutError') {
        throw new HttpException(
          'Request timed out. The operation may still be processing on the server. Kiểm tra logs của microservice schedule.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }
      // Check if error is from RPC exception and handle status code appropriately
      else if (error.error && error.error.statusCode) {
        // Extract status code and message from RPC error
        const statusCode = error.error.statusCode;
        const message = error.error.message || 'Unknown microservice error';

        // Map microservice status codes to HTTP status codes
        let httpStatus: HttpStatus;
        switch (statusCode) {
          case 404:
            httpStatus = HttpStatus.NOT_FOUND;
            break;
          case 400:
            httpStatus = HttpStatus.BAD_REQUEST;
            break;
          case 403:
            httpStatus = HttpStatus.FORBIDDEN;
            break;
          default:
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        throw new HttpException(message, httpStatus);
      }
      // Check for specific error messages that indicate "not found"
      else if (error.message && (
        error.message.includes('not found') ||
        error.message.includes('No maintenance cycles')
      )) {
        throw new HttpException(
          error.message,
          HttpStatus.NOT_FOUND
        );
      } else {
        throw new HttpException(
          `Error occurred while triggering automated maintenance schedules: ${error.message || 'Unknown error'}. Kiểm tra kết nối RabbitMQ và logs của microservice.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
