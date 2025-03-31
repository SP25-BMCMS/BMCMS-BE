import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints';
import { TASKASSIGNMENT_PATTERN } from 'libs/contracts/src/taskAssigment/taskAssigment.patterns';
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto';
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment';
import { AssignmentStatus } from '@prisma/client-Task';
import { firstValueFrom } from 'rxjs';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { ChangeTaskAssignmentStatusDto } from '@app/contracts/taskAssigment/changeTaskStatusDto ';

@Injectable()
export class TaskAssignmentService {
  constructor(@Inject(TASK_CLIENT) private readonly taskClient: ClientProxy) { }

  // Create Task Assignment
  async createTaskAssignment(createTaskAssignmentDto: CreateTaskAssignmentDto) {
    try {
      return await firstValueFrom(
        this.taskClient.send(
          TASKASSIGNMENT_PATTERN.CREATE,
          createTaskAssignmentDto,
        ),
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Error creating task assignment',
      });
    }
  }

  // Update Task Assignment
  async updateTaskAssignment(
    taskAssignmentId: string,
    updateTaskAssignmentDto: UpdateTaskAssignmentDto,
  ) {
    try {
      return await firstValueFrom(
        this.taskClient.send(TASKASSIGNMENT_PATTERN.UPDATE, {
          id: taskAssignmentId,
          ...updateTaskAssignmentDto,
        }),
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Error updating task assignment',
      });
    }
  }

  // Delete Task Assignment (Change status to 'notcompleted')
  async deleteTaskAssignment(taskAssignmentId: string) {
    try {
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.DELELTE, {
        taskAssignmentId,
      });
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Error deleting task assignment',
      });
    }
  }

  // Get Task Assignments by User ID
  async getTaskAssignmentByUserId(userId: string) {
    try {
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.GET_BY_USERID, {
        userId,
      });
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments by user ID',
      });
    }
  }

  // Get Task Assignment by ID
  async getTaskAssignmentById(taskAssignmentId: string) {
    try {
      return await firstValueFrom(
        this.taskClient.send(TASKASSIGNMENT_PATTERN.GET_BY_TASKID, {
          assignment_id: taskAssignmentId,
        }),
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignment by ID',
      });
    }
  }

  // Get all Task Assignments
  async getAllTaskAssignments(paginationParams: PaginationParams) {
    try {
      return await firstValueFrom(
        this.taskClient.send(TASKASSIGNMENT_PATTERN.GET, paginationParams),
      );
    } catch (error) {
      console.error('Error in getAllTaskAssignments:', error);
      throw error;
    }
  }

  // Reassign Task Assignment
  async reassignTaskAssignment(
    taskAssignmentId: string,
    newEmployeeId: string,
  ) {
    try {
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.REASSIGN, {
        taskAssignmentId,
        newEmployeeId,
      });
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Error reassigning task assignment',
      });
    }
  }

  // Get Task Assignments by Status
  async getTaskAssignmentsByStatus(status: AssignmentStatus) {
    try {
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.GET_BY_STATUS, {
        status,
      });
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments by status',
      });
    }
  }

  async getTaskAssignmentsByTaskId(taskId: string) {
    return await firstValueFrom(
      this.taskClient.send(TASKASSIGNMENT_PATTERN.GET_BY_TASKID, {
        task_id: taskId,
      }),
    );
  }

  // Assign Task to Employee
  async assignTaskToEmployee(taskId: string, employeeId: string, description: string) {
    try {
      return await firstValueFrom(
        this.taskClient.send(TASKASSIGNMENT_PATTERN.ASSIGN_TO_EMPLOYEE, {
          taskId,
          employeeId,
          description
        }),
      );
    } catch (error) {
      console.error('Error assigning task to employee:', error);
      if (error.response) {
        throw new HttpException(
          error.response.message || 'Error assigning task to employee',
          error.response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      throw new HttpException(
        'Error assigning task to employee',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Change Task Assignment Status
  async changeTaskAssignmentStatus(changeStatusDto: ChangeTaskAssignmentStatusDto) {
    try {
      return await firstValueFrom(
        this.taskClient.send(
          TASKASSIGNMENT_PATTERN.CHANGE_STATUS,
          changeStatusDto
        ),
      );
    } catch (error) {
      console.error('Error changing task assignment status:', error);
      if (error.response) {
        throw new HttpException(
          error.response.message || 'Error changing task assignment status',
          error.response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      throw new HttpException(
        'Error changing task assignment status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
