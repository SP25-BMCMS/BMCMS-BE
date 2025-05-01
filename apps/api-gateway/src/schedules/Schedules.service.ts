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

  // Phương thức tiện ích để xử lý lỗi từ microservice một cách nhất quán
  private handleMicroserviceError(error: any, defaultMessage: string = 'An error occurred'): never {
    console.error('Handling microservice error:', error);
    console.log('Error type:', typeof error, 'Constructor:', error?.constructor?.name);

    // 1. Check pattern for RpcException
    if (error instanceof Object && error.constructor && error.constructor.name === 'RpcException') {
      console.log('Detected RpcException, properly forwarding status code');
      if (error.error && error.error.statusCode) {
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
    }

    // 2. Check error object structure directly
    if (error && typeof error === 'object') {
      console.log('Checking detailed error structure:', JSON.stringify(error, null, 2));

      // Look for statusCode in nested error object
      if (error.error && (error.error.statusCode === 404 || error.error.status === 404)) {
        console.log('Found 404 status code in nested error object');
        throw new HttpException(
          error.error.message || 'Resource not found',
          HttpStatus.NOT_FOUND
        );
      }

      // Check for status code directly on the error object
      if (error.status === 404 || error.statusCode === 404) {
        console.log('Found 404 status code directly on error object');
        throw new HttpException(
          error.message || 'Resource not found',
          HttpStatus.NOT_FOUND
        );
      }

      // Check for message patterns that suggest 404
      if (error.message && (
        error.message.includes('not found') ||
        error.message.includes('Not found') ||
        error.message.includes('do not exist') ||
        error.message.includes('không tồn tại')
      )) {
        console.log('Message pattern suggests 404 error');
        throw new HttpException(
          error.message,
          HttpStatus.NOT_FOUND
        );
      }
    }

    // Handle timeout errors specifically
    if (error.name === 'TimeoutError') {
      throw new HttpException(
        'Request timed out. The microservice might be down or not responding.',
        HttpStatus.REQUEST_TIMEOUT,
      );
    }

    // Handle existing HttpExceptions
    if (error instanceof HttpException) {
      throw error;
    }

    // Default error handling
    console.log('Falling back to default error handling');
    throw new HttpException(
      `${defaultMessage}: ${error.message || 'Unknown error'}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  // Create schedule (Microservice)
  async createSchedule(createScheduleDto: CreateScheduleDto): Promise<any> {
    try {
      console.log('Creating new schedule:', createScheduleDto);

      // Validate required fields
      if (!createScheduleDto.schedule_name) {
        throw new HttpException(
          'Schedule name is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!createScheduleDto.cycle_id) {
        throw new HttpException(
          'Maintenance cycle ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Send request to microservice with timeout
      const response = await firstValueFrom(
        this.scheduleClient.send(
          SCHEDULES_PATTERN.CREATE,
          createScheduleDto,
        ).pipe(
          timeout(15000), // 15 second timeout
          catchError(err => {
            console.error('Error in createSchedule microservice call:', err);
            throw err; // Let the catch block handle this error
          })
        )
      );

      return response;
    } catch (error) {
      return this.handleMicroserviceError(error, 'Error occurred while creating schedule');
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
        }).pipe(
          timeout(15000), // 15 second timeout
          catchError(err => {
            console.error('Error in updateSchedule microservice call:', err);
            throw err; // Let the catch block handle this error
          })
        )
      )

      return response
    } catch (error) {
      return this.handleMicroserviceError(error, 'Error occurred while updating schedule');
    }
  }

  // Get schedule by ID (Microservice)
  async getScheduleById(schedule_id: string): Promise<any> {
    console.log(
      '🚀 ~ SchedulesService ~ getScheduleById ~ schedule_id:',
      schedule_id,
    )
    try {
      return await firstValueFrom(
        this.scheduleClient.send(
          SCHEDULES_PATTERN.GET_BY_ID,
          schedule_id,
        ).pipe(
          timeout(10000), // 10 second timeout
          catchError(err => {
            console.error('Error in getScheduleById microservice call:', err);
            throw err; // Let the catch block handle this error
          })
        )
      )
    } catch (error) {
      return this.handleMicroserviceError(error, 'Error occurred while fetching schedule by ID');
    }
  }

  // Get all schedules (Microservice)
  async getAllSchedules(paginationParams: PaginationParams = {}): Promise<any> {
    try {
      return await firstValueFrom(
        this.scheduleClient.send(
          SCHEDULES_PATTERN.GET,
          paginationParams,
        ).pipe(
          timeout(15000), // 15 second timeout
          catchError(err => {
            console.error('Error in getAllSchedules microservice call:', err);
            throw err; // Let the catch block handle this error
          })
        )
      )
    } catch (error) {
      return this.handleMicroserviceError(error, 'Error occurred while fetching all schedules');
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
          .pipe(
            timeout(10000), // 10 second timeout
            catchError(err => {
              console.error('Error in deleteSchedule microservice call:', err);
              throw err; // Let the catch block handle this error
            })
          )
      )

      return response
    } catch (error) {
      return this.handleMicroserviceError(error, 'Error occurred while deleting schedule');
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
          .pipe(
            timeout(60000), // 60 second timeout
            catchError(err => {
              console.error('Error in createAutoMaintenanceSchedule microservice call:', err);
              if (err.name === 'TimeoutError') {
                throw new HttpException(
                  'Request timed out. The microservice might be down or not responding.',
                  HttpStatus.REQUEST_TIMEOUT,
                );
              }
              throw err;
            })
          )
      );

      return response;
    } catch (error) {
      console.error('Error creating automated maintenance schedule:', error);

      // Handle specific error codes from the microservice
      if (error.error && error.error.statusCode) {
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

      // Handle timeout errors specifically
      if (error.name === 'TimeoutError') {
        throw new HttpException(
          'Request timed out. Kiểm tra xem microservice schedule có đang chạy không và RabbitMQ queue đã được cấu hình đúng.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      // Handle existing HttpExceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle error with message patterns
      if (error.message && (
        error.message.includes('not found') ||
        error.message.includes('Not found') ||
        error.message.includes('do not exist'))) {
        throw new HttpException(
          error.message,
          HttpStatus.NOT_FOUND
        );
      }

      // Default error
      throw new HttpException(
        `Error occurred while creating automated maintenance schedule: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
          .pipe(
            timeout(60000), // 60 second timeout
            catchError(err => {
              console.error('Error in triggerAutoMaintenanceSchedule microservice call:', err);
              if (err.name === 'TimeoutError') {
                throw new HttpException(
                  'Request timed out. The operation may still be processing on the server.',
                  HttpStatus.REQUEST_TIMEOUT,
                );
              }
              throw err;
            })
          )
      );

      return response;
    } catch (error) {
      console.error('Error triggering automated maintenance schedule creation:', error);

      // Handle specific error codes from the microservice
      if (error.error && error.error.statusCode) {
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

      // Handle timeout errors specifically
      if (error.name === 'TimeoutError') {
        throw new HttpException(
          'Request timed out. The operation may still be processing on the server. Kiểm tra logs của microservice schedule.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      // Handle existing HttpExceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Check for specific error messages that indicate "not found"
      if (error.message && (
        error.message.includes('not found') ||
        error.message.includes('No maintenance cycles'))) {
        throw new HttpException(
          error.message,
          HttpStatus.NOT_FOUND
        );
      }

      // Default catch-all error
      throw new HttpException(
        `Error occurred while triggering automated maintenance schedules: ${error.message || 'Unknown error'}. Kiểm tra kết nối RabbitMQ và logs của microservice.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Generate schedules from configuration
  async generateSchedulesFromConfig(configDto: any): Promise<any> {
    try {
      console.log('Generating schedules from configuration:', configDto);

      // Basic validation
      if (!configDto.cycle_configs || !Array.isArray(configDto.cycle_configs) || configDto.cycle_configs.length === 0) {
        throw new HttpException(
          'At least one cycle configuration is required',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!configDto.buildingDetails || !Array.isArray(configDto.buildingDetails) || configDto.buildingDetails.length === 0) {
        throw new HttpException(
          'At least one building detail ID is required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate each cycle configuration
      configDto.cycle_configs.forEach((config, index) => {
        if (!config.cycle_id) {
          throw new HttpException(
            `Cycle ID is required for cycle configuration at index ${index}`,
            HttpStatus.BAD_REQUEST
          );
        }
      });

      // Send request to microservice
      const response = await firstValueFrom(
        this.scheduleClient
          .send(SCHEDULES_PATTERN.GENERATE_SCHEDULES, configDto)
          .pipe(
            timeout(60000), // 60 second timeout
            catchError(err => {
              console.error('Error in generateSchedulesFromConfig microservice call:', err);
              if (err.name === 'TimeoutError') {
                throw new HttpException(
                  'Request timed out. The operation may still be processing on the server.',
                  HttpStatus.REQUEST_TIMEOUT,
                );
              }
              throw err;
            })
          )
      );

      return response;
    } catch (error) {
      return this.handleMicroserviceError(error, 'Error occurred while generating schedules from configuration');
    }
  }
  async getSchedulesByManagerId(managerId: string, paginationParams: PaginationParams = {}): Promise<any> {
    try {
      // Validate the manager ID
      if (!managerId) {
        throw new HttpException(
          'Manager ID is required',
          HttpStatus.BAD_REQUEST
        );
      }

      console.log(`Getting schedules for manager ID: ${managerId}`);

      // Send request to microservice
      const response = await firstValueFrom(
        this.scheduleClient.send(
          SCHEDULES_PATTERN.GET_BY_MANAGER_ID,
          { managerId, paginationParams }
        ).pipe(
          timeout(15000), // 15 second timeout
          catchError(err => {
            console.error('Error in getSchedulesByManagerId microservice call:', err);
            throw err; // Let the catch block handle this error
          })
        )
      );

      return response;
    } catch (error) {
      return this.handleMicroserviceError(error, 'Error occurred while fetching schedules for manager');
    }
  }
}
