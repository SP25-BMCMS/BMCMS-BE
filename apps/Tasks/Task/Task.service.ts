// task.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient, Status } from '@prisma/client-Task'
import { RpcException } from '@nestjs/microservices';
import { CreateTaskDto } from 'libs/contracts/src/tasks/create-Task.dto';
import { UpdateTaskDto } from 'libs/contracts/src/tasks/update.Task';
import { ChangeTaskStatusDto } from 'libs/contracts/src/tasks/ChangeTaskStatus.Dto ';

@Injectable()
export class TaskService {
  private prisma = new PrismaClient();

  async createTask(createTaskDto: CreateTaskDto) {
    try {
      const newTask = await this.prisma.task.create({
        data: {
          description: createTaskDto.description,
          status: createTaskDto.status,
          crack_id: createTaskDto.crack_id,
          schedule_job_id: createTaskDto.schedule_job_id,
        },
      });
      return {
        statusCode: 201,
        message: 'Task created successfully',
        data: newTask,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task creation failed',
      });
    }
  }

  async updateTask(task_id: string, updateTaskDto: UpdateTaskDto) {
    try {
      const updatedTask = await this.prisma.task.update({
        where: { task_id },
        data: {
          description: updateTaskDto.description,
          status: updateTaskDto.status,
          crack_id: updateTaskDto.crack_id,
          schedule_job_id: updateTaskDto.schedule_job_id,
        },
      });
      return {
        statusCode: 200,
        message: 'Task updated successfully',
        data: updatedTask,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task update failed',
      });
    }
  }

  async getTaskById(task_id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { task_id },
      });
      if (!task) {
        return {
          statusCode: 404,
          message: 'Task not found',
        };
      }
      return {
        statusCode: 200,
        message: 'Task retrieved successfully',
        data: task,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving task',
      });
    }
  }

  async deleteTask(task_id: string) {
    try {
      const deletedTask = await this.prisma.task.update({
        where: { task_id },
        data: { status: 'Completed' },  // Mark the task as completed when deleted
      });
      return {
        statusCode: 200,
        message: 'Task deleted successfully',
        data: deletedTask,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task deletion failed',
      });
    }
  }

  // async changeTaskStatus(task_id: string, changeTaskStatusDto: ChangeTaskStatusDto) {
  //   try {
  //     const updatedTask = await this.prisma.task.update({
  //       where: { task_id },
  //       data: {
  //         status: changeTaskStatusDto.status,
  //       },
  //     });
  //     return {
  //       statusCode: 200,
  //       message: 'Task status updated successfully',
  //       data: updatedTask,
  //     };
  //   } catch (error) {
  //     console.error("Error updating task status:", error);  // Lo
  //     throw new RpcException({
  //       statusCode: 400,
  //       message: 'Error updating task status',
  //     });
  //   }
  // }
  async changeTaskStatus(task_id: string, changeTaskStatusDto: string) {
    console.log("🚀 ~ TaskService ~ changeTaskStatus ~ task_id:", task_id)
    try {
      console.log("🚀 ~ TaskService ~ changeTaskStatus ~ task_id:", task_id)
      console.log("🚀 ~ TaskService ~ changeTaskStatus ~ changeTaskStatusDto:", changeTaskStatusDto)

      // Check if the task exists before trying to update
      const task = await this.prisma.task.findUnique({
        where: { task_id },
      });
  
      // If task does not exist, throw an exception
      if (!task) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task not found',
        });
      }
      const status: Status = changeTaskStatusDto as Status;  // This assumes changeTaskStatusDto is a valid status string

      // Proceed to update the status
      const updatedTask = await this.prisma.task.update({
        where: { task_id },
        data: {
          status : status,
        },
      });
  
      return {
        statusCode: 200,
        message: 'Task status updated successfully',
        data: updatedTask,
      };
    } catch (error) {
      console.error("Error updating task status:", error);  // Log error details for debugging
  
      // Return a meaningful response for the error
      throw new RpcException({
        statusCode: 400,
        message: 'Error updating task status',
        error: error.message,  // Include the error message for debugging
      });
    }
  }
  async getAllTasks() {
    try {
      const tasks = await this.prisma.task.findMany();
      return {
        statusCode: 200,
        message: 'Tasks fetched successfully',
        data: tasks,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving tasks',
      });
    }
  }

  async getTasksByStatus(status: Status) {
    try {
      const tasks = await this.prisma.task.findMany({
        where: { status },
      });
      return {
        statusCode: 200,
        message: 'Tasks by status fetched successfully',
        data: tasks,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving tasks by status',
      });
    }
  }
}
