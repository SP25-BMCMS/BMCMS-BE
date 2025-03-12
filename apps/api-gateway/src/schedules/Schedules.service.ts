import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SCHEDULE_CLIENT } from '../constraints';
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto';
import { SCHEDULES_PATTERN } from '@app/contracts/schedules/Schedule.patterns';
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules';
import { $Enums } from '@prisma/client-Schedule';

// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'
@Injectable()
export class SchedulesService {
  constructor(@Inject(SCHEDULE_CLIENT) private readonly scheduleClient: ClientProxy) {}

  // Create schedule (Microservice)
  async createSchedule(createScheduleDto: CreateScheduleDto): Promise<any> {
    try {
      return await this.scheduleClient.send(SCHEDULES_PATTERN.CREATE, createScheduleDto);
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating schedule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update schedule (Microservice)
  async updateSchedule(schedule_id: string, updateScheduleDto: UpdateScheduleDto): Promise<any> {
    try {
      return await this.scheduleClient.send(SCHEDULES_PATTERN.UPDATE, {
        schedule_id,
        ...updateScheduleDto,
      });
    } catch (error) {
      throw new HttpException(
        'Error occurred while updating schedule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Change schedule type (Microservice)
  async changeScheduleType(schedule_id: string, schedule_type: $Enums.ScheduleType): Promise<any> {
    try {
      return await this.scheduleClient.send(SCHEDULES_PATTERN.UPDATE_TYPE, {
        schedule_id,
        schedule_type,
      });
    } catch (error) {
      throw new HttpException(
        'Error occurred while changing schedule type',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get schedule by ID (Microservice)
  async getScheduleById(schedule_id: string): Promise<any> {
    try {
      return await this.scheduleClient.send(SCHEDULES_PATTERN.GET_BY_ID, { schedule_id });
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching schedule by ID',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Get all schedules (Microservice)
  async getAllSchedules(): Promise<any> {
    try {
      return await this.scheduleClient.send(SCHEDULES_PATTERN.GET, {});
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching all schedules',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      });
    } catch (error) {
      throw new HttpException(
        'Task not found for the given schedule assignment ID = ' + schedule_assignment_id,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}