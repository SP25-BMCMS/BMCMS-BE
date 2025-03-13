import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy, RpcException } from '@nestjs/microservices'
import { TASK_CLIENT } from '../constraints'
import { TASKASSIGNMENT_PATTERN } from 'libs/contracts/src/taskAssigment/taskAssigment.patterns';
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto';
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment';
import {AssignmentStatus} from '@prisma/client-Task'
@Injectable()
export class TaskAssignmentService {
  constructor(@Inject(TASK_CLIENT) private readonly taskClient: ClientProxy) {}

  // Create Task Assignment
  async createTaskAssignment(createTaskAssignmentDto: CreateTaskAssignmentDto) {
    try {
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.CREATE, createTaskAssignmentDto);
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Error creating task assignment',
      });
    }
  }

  // Update Task Assignment
  async updateTaskAssignment(taskAssignmentId: string, updateTaskAssignmentDto: UpdateTaskAssignmentDto) {
    try {
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.UPDATE, { taskAssignmentId, updateTaskAssignmentDto });
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
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.DELELTE, { taskAssignmentId });
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
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.GET_BY_USERID, { userId });
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
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.GET_BY_TASKID, { taskAssignmentId });
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignment by ID',
      });
    }
  }

  // Get all Task Assignments
  async getAllTaskAssignments() {
    try {
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.GET, {});
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching all task assignments',
      });
    }
  }

  // Reassign Task Assignment
  async reassignTaskAssignment(taskAssignmentId: string, newEmployeeId: string) {
    try {
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.REASSIGN, { taskAssignmentId, newEmployeeId });
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
      return await this.taskClient.send(TASKASSIGNMENT_PATTERN.GET_BY_STATUS, { status });
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments by status',
      });
    }
  }
}