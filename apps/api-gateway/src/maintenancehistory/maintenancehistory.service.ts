import { Inject, Injectable, Logger, HttpException, HttpStatus, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BUILDING_CLIENT } from '../constraints';
import { UpdateMaintenanceHistoryDto } from '@app/contracts/maintenancehistory/update-maintenancehistory.dto';
import { firstValueFrom, timeout, catchError, throwError, Observable } from 'rxjs';
import { MAINTENANCEHISTORY_PATTERN } from '@app/contracts/maintenancehistory/maintenancehistory.patterns';
import { CreateMaintenanceHistoryDto } from '@app/contracts/maintenancehistory/create-maintenancehistory.dto';

@Injectable()
export class MaintenancehistoryService {
  private readonly logger = new Logger(MaintenancehistoryService.name);

  constructor(
    @Inject(BUILDING_CLIENT) private readonly buildingsClient: ClientProxy
  ) { }

  async create(createMaintenanceHistoryDto: CreateMaintenanceHistoryDto) {
    try {
      return await firstValueFrom(
        this.buildingsClient.send(MAINTENANCEHISTORY_PATTERN.CREATE, createMaintenanceHistoryDto)
          .pipe(
            timeout(10000),
            catchError(error => {
              this.logger.error(`Error creating maintenance history: ${error.message}`, error.stack);
              return throwError(() => this.handleMicroserviceError(error));
            })
          )
      );
    } catch (error) {
      throw this.handleMicroserviceError(error);
    }
  }

  async findAll(page = 1, limit = 10) {
    try {
      const pattern = MAINTENANCEHISTORY_PATTERN.GET_ALL;
      return await firstValueFrom(
        this.buildingsClient.send(pattern, { page, limit })
          .pipe(
            timeout(10000),
            catchError(error => {
              this.logger.error(`Error fetching maintenance history: ${error.message}`, error.stack);
              return throwError(() => this.handleMicroserviceError(error));
            })
          )
      );
    } catch (error) {
      throw this.handleMicroserviceError(error);
    }
  }

  async findOne(id: string) {
    try {
      return await firstValueFrom(
        this.buildingsClient.send(MAINTENANCEHISTORY_PATTERN.GET_BY_ID, id)
          .pipe(
            timeout(10000),
            catchError(error => {
              this.logger.error(`Error fetching maintenance history by ID: ${error.message}`, error.stack);
              return throwError(() => this.handleMicroserviceError(error));
            })
          )
      );
    } catch (error) {
      throw this.handleMicroserviceError(error);
    }
  }

  async findByDeviceId(deviceId: string, page = 1, limit = 10) {
    try {
      return await firstValueFrom(
        this.buildingsClient.send(MAINTENANCEHISTORY_PATTERN.GET_BY_DEVICE_ID, { deviceId, page, limit })
          .pipe(
            timeout(10000),
            catchError(error => {
              this.logger.error(`Error fetching maintenance history by device ID: ${error.message}`, error.stack);
              return throwError(() => this.handleMicroserviceError(error));
            })
          )
      );
    } catch (error) {
      throw this.handleMicroserviceError(error);
    }
  }

  async findByBuildingId(buildingId: string, page = 1, limit = 10) {
    try {
      return await firstValueFrom(
        this.buildingsClient.send(MAINTENANCEHISTORY_PATTERN.GET_BY_BUILDING_ID, { buildingId, page, limit })
          .pipe(
            timeout(10000),
            catchError(error => {
              this.logger.error(`Error fetching maintenance history by building ID: ${error.message}`, error.stack);
              return throwError(() => this.handleMicroserviceError(error));
            })
          )
      );
    } catch (error) {
      throw this.handleMicroserviceError(error);
    }
  }

  async update(id: string, updateMaintenanceHistoryDto: UpdateMaintenanceHistoryDto) {
    try {
      return await firstValueFrom(
        this.buildingsClient.send(MAINTENANCEHISTORY_PATTERN.UPDATE, {
          id,
          updateMaintenanceHistoryDto
        })
          .pipe(
            timeout(10000),
            catchError(error => {
              this.logger.error(`Error updating maintenance history: ${error.message}`, error.stack);
              return throwError(() => this.handleMicroserviceError(error));
            })
          )
      );
    } catch (error) {
      throw this.handleMicroserviceError(error);
    }
  }

  async remove(id: string) {
    try {
      return await firstValueFrom(
        this.buildingsClient.send(MAINTENANCEHISTORY_PATTERN.DELETE, id)
          .pipe(
            timeout(10000),
            catchError(error => {
              this.logger.error(`Error deleting maintenance history: ${error.message}`, error.stack);
              return throwError(() => this.handleMicroserviceError(error));
            })
          )
      );
    } catch (error) {
      throw this.handleMicroserviceError(error);
    }
  }

  // Helper method to handle microservice errors
  private handleMicroserviceError(error: any): HttpException {
    console.error('Error from microservice:', error);
    this.logger.error(`Error in maintenance history service: ${error.message}`, error.stack);

    // Check if it's a NestJS HttpException (from interceptors or manual throws)
    if (error instanceof HttpException) {
      return error;
    }

    // Lỗi có cấu trúc { statusCode, message, error } từ RPC exception
    if (error?.response?.statusCode || error?.statusCode) {
      const statusCode = error.response?.statusCode || error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.message || error.message || 'Error processing request';
      const errorDetail = error.response?.error || error.error || 'Unknown error';

      switch (statusCode) {
        case HttpStatus.NOT_FOUND:
          return new NotFoundException(message);
        case HttpStatus.BAD_REQUEST:
          return new BadRequestException(message);
        case HttpStatus.CONFLICT:
          return new ConflictException(message);
        default:
          return new HttpException({
            statusCode,
            message,
            error: errorDetail
          }, statusCode);
      }
    }

    // Phân tích message để xác định loại lỗi
    if (error?.message) {
      if (error.message.includes('not found') || error.message.includes('Not Found')) {
        return new NotFoundException(error.message);
      } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return new ConflictException(error.message);
      } else if (error.message.includes('invalid') || error.message.includes('Invalid') ||
        error.message.includes('constraint') || error.message.includes('Bad Request')) {
        return new BadRequestException(error.message);
      }
    }

    // Nếu là lỗi timeout
    if (error.name === 'TimeoutError') {
      return new HttpException({
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        error: 'Request Timeout',
        message: 'Service request timed out'
      }, HttpStatus.REQUEST_TIMEOUT);
    }

    // Lỗi không xác định
    return new HttpException({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal server error',
      message: error.message || 'Something went wrong'
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
