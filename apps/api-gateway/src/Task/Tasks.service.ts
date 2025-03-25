import {
  Body,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints';
import { TASKS_PATTERN } from 'libs/contracts/src/tasks/task.patterns';
import { catchError, firstValueFrom } from 'rxjs';
import { INSPECTIONS_PATTERN } from '../../../../libs/contracts/src/inspections/inspection.patterns';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { UpdateInspectionDto } from '../../../../libs/contracts/src/inspections/update-inspection.dto';
import { CreateRepairMaterialDto } from 'libs/contracts/src/tasks/create-repair-material.dto';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';

// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'
@Injectable()
export class TaskService {
  constructor(@Inject(TASK_CLIENT) private readonly taskClient: ClientProxy) { }

  async createTask(createTaskDto: any) {
    try {
      return await this.taskClient.send(TASKS_PATTERN.CREATE, createTaskDto);
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating task',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateTask(task_id: string, updateTaskDto: any) {
    try {
      return await this.taskClient.send(TASKS_PATTERN.UPDATE, {
        task_id,
        ...updateTaskDto,
      });
    } catch (error) {
      throw new HttpException(
        'Error occurred while updating task',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTaskById(task_id: string) {
    try {
      return await this.taskClient.send(TASKS_PATTERN.GET_BY_ID, { task_id });
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching task by ID',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async deleteTask(task_id: string) {
    try {
      return await this.taskClient.send(TASKS_PATTERN.DELELTE, { task_id });
    } catch (error) {
      throw new HttpException(
        'Error occurred while deleting task',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async changeTaskStatus(task_id: string, status: string) {
    try {
      console.log('🚀 ~ TaskSerdddddvice ~ changeTaskStatus ~ status:', status);

      return await this.taskClient.send(TASKS_PATTERN.CHANGE_STATUS, {
        task_id,
        status,
      });
    } catch (error) {
      throw new HttpException(
        'Error occurred while changing task status',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getAllTasks(paginationParams: PaginationParams = {}) {
    try {
      return await this.taskClient.send(TASKS_PATTERN.GET, paginationParams);
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching all tasks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTasksByStatus(status: string) {
    try {
      return await this.taskClient.send(TASKS_PATTERN.GET_BY_STATUS, {
        status,
      });
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching tasks by status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async GetInspectionByTaskAssignmentId(task_assignment_id: string) {
    try {
      return this.taskClient.send(
        INSPECTIONS_PATTERN.GET_BY_ID_Task_Assignment,
        {
          task_assignment_id,
        },
      );
    } catch (error) {
      throw new HttpException(
        'Inspection not found with the given task assignment ID = ' +
        task_assignment_id,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async updateInspection(@Param('id') inspection_id: string, @Body() dto: UpdateInspectionDto) {
    return firstValueFrom(
      this.taskClient.send(INSPECTIONS_PATTERN.UPDATE, { inspection_id, dto }).pipe(
        catchError(err => {
          throw new NotFoundException(err.message);
        })
      )
    );
  }

  async GetInspectionByCrackId(crack_id: string) {
    try {
      return this.taskClient.send(
        INSPECTIONS_PATTERN.GET_BY_CRACK_ID,
        { crack_id }
      );
    } catch (error) {
      throw new HttpException(
        'Inspection not found with the given crack ID = ' + crack_id,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async GetAllInspections() {
    try {
      return this.taskClient.send(
        INSPECTIONS_PATTERN.GET,
        {}
      );
    } catch (error) {
      throw new HttpException(
        'Error retrieving all inspections',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createRepairMaterial(createRepairMaterialDto: CreateRepairMaterialDto) {
    try {
      return await this.taskClient.send(
        TASKS_PATTERN.CREATE_REPAIR_MATERIAL,
        createRepairMaterialDto
      );
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating repair material',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
