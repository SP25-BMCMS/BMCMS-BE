import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AssignmentStatus, PrismaClient } from '@prisma/client-Task';
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto';
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment';
import { PrismaService } from '../../users/prisma/prisma.service';
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class TaskAssignmentsService {
  private prisma = new PrismaClient();

  constructor(private prismaService: PrismaService) {}

  async createTaskAssignment(createTaskAssignmentDto: CreateTaskAssignmentDto) {
    try {
      const newAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: createTaskAssignmentDto.task_id,
          employee_id: createTaskAssignmentDto.employee_id,
          description: createTaskAssignmentDto.description,
          status: createTaskAssignmentDto.status,
        },
      });
      return {
        statusCode: 201,
        message: 'Task assignment created successfully',
        data: newAssignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment creation failed',
      });
    }
  }

  async updateTaskAssignment(
    taskAssignmentId: string,
    updateTaskAssignmentDto: UpdateTaskAssignmentDto,
  ) {
    try {
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: taskAssignmentId },
        data: {
          task_id: updateTaskAssignmentDto.task_id,
          employee_id: updateTaskAssignmentDto.employee_id,
          description: updateTaskAssignmentDto.description,
          status: updateTaskAssignmentDto.status,
        },
      });
      return {
        statusCode: 200,
        message: 'Task assignment updated successfully',
        data: updatedAssignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment update failed',
      });
    }
  }

  // async deleteTaskAssignment(taskAssignmentId: string) {
  //   try {
  //     const updatedAssignment = await this.prisma.taskAssignment.update({
  //       where: { assignment_id: taskAssignmentId },
  //       data: { status: AssignmentStatus.notcompleted }, // Change status to 'notcompleted'
  //     });
  //     return {
  //       statusCode: 200,
  //       message: 'Task assignment marked as not completed',
  //       data: updatedAssignment,
  //     };
  //   } catch (error) {
  //     throw new RpcException({
  //       statusCode: 400,
  //       message: 'Task assignment update failed',
  //     });
  //   }
  async getTaskAssignmentByUserId(userId: string) {
    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: { employee_id: userId },
      });
      return {
        statusCode: 200,
        message: 'Task assignments fetched successfully',
        data: assignments,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments for user',
      });
    }
  }

  async getTaskAssignmentById(taskAssignmentId: string) {
    try {
      const assignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignmentId },
      });
      if (!assignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }
      return {
        statusCode: 200,
        message: 'Task assignment fetched successfully',
        data: assignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignment',
      });
    }
  }

  async getAllTaskAssignments(
    paginationParams: PaginationParams = { page: 1, limit: 10 },
  ): Promise<PaginationResponseDto<any>> {
    try {
      const page = Number(paginationParams.page) || 1;
      const limit = Number(paginationParams.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.prisma.taskAssignment.count();

      // Get paginated task assignments
      const taskAssignments = await this.prisma.taskAssignment.findMany({
        skip,
        take: limit,
        include: {
          task: true,
          // assignedTo: true
        },
        orderBy: {
          //assignedAt: 'desc'
        },
      });

      const responseData = {
        statusCode: 200,
        message: 'Danh sách phân công công việc',
        data: taskAssignments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      return responseData;
    } catch (error) {
      console.error('Error in getAllTaskAssignments:', error);
      const errorData = {
        statusCode: 500,
        message: error.message,
        data: [],
        pagination: {
          total: 0,
          page: Number(paginationParams.page) || 1,
          limit: Number(paginationParams.limit) || 10,
          totalPages: 0,
        },
      };

      return errorData;
    }
  }

  async reassignTaskAssignment(
    taskAssignmentId: string,
    newEmployeeId: string,
  ) {
    try {
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: taskAssignmentId },
        data: {
          employee_id: newEmployeeId, // Reassign the task to the new employee
        },
      });
      return {
        statusCode: 200,
        message: 'Task assignment reassigned successfully',
        data: updatedAssignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Error reassigning task assignment',
      });
    }
  }

  async getTaskAssignmentByStatus(status: AssignmentStatus) {
    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: { status },
      });
      return {
        statusCode: 200,
        message: 'Task assignments by status fetched successfully',
        data: assignments,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments by status',
      });
    }
  }
}
