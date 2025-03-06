import { CreateWorkLogDto } from "@app/contracts/Worklog/create-Worklog.dto";
import { UpdateWorkLogDto } from "@app/contracts/Worklog/update.Worklog";
import { WorkLogResponseDto } from "@app/contracts/Worklog/Worklog.dto";
import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { PrismaClient } from "@prisma/client-Task";
@Injectable()
export class WorkLogService {
  private prisma = new PrismaClient();

  // Create WorkLog for Task
  async createWorkLogForTask(createWorkLogForTaskDto: CreateWorkLogDto): Promise<WorkLogResponseDto> {
    try {
      const newWorkLog = await this.prisma.workLog.create({
        data: {
          task_id: createWorkLogForTaskDto.task_id,
          title: createWorkLogForTaskDto.title,
          description: createWorkLogForTaskDto.description,
          status: createWorkLogForTaskDto.status,
        },
      });
      return {
        worklog_id: newWorkLog.worklog_id,
        task_id: newWorkLog.task_id,
        title: newWorkLog.title,
        description: newWorkLog.description,
        status: newWorkLog.status,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'WorkLog creation failed',
      });
    }
  }

  // Get WorkLogs by TaskId
  async getWorkLogsByTaskId(task_id: string): Promise<WorkLogResponseDto[]> {
    try {
      const workLogs = await this.prisma.workLog.findMany({
        where: { task_id },
      });
      return workLogs.map(workLog => ({
        worklog_id: workLog.worklog_id,
        task_id: workLog.task_id,
        title: workLog.title,
        description: workLog.description,
        status: workLog.status,
        created_at: workLog.created_at,
        updated_at: workLog.updated_at,
      }));
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving WorkLogs by TaskId',
      });
    }
  }

  // Get WorkLog by ID
  async getWorkLogById(worklog_id: string): Promise<WorkLogResponseDto> {
    try {
      const workLog = await this.prisma.workLog.findUnique({
        where: { worklog_id },
      });
      if (!workLog) {
        throw new RpcException({
          statusCode: 404,
          message: 'WorkLog not found',
        });
      }
      return {
        worklog_id: workLog.worklog_id,
        task_id: workLog.task_id,
        title: workLog.title,
        description: workLog.description,
        status: workLog.status,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving WorkLog by ID',
      });
    }
  }

  // Update WorkLog Status
  async updateWorkLogStatus(updateWorkLogStatusDto: UpdateWorkLogDto): Promise<WorkLogResponseDto> {
    try {
      const updatedWorkLog = await this.prisma.workLog.update({
        where: { worklog_id: updateWorkLogStatusDto.worklog_id },
        data: {
          status: updateWorkLogStatusDto.status,
        },
      });
      return {
        worklog_id: updatedWorkLog.worklog_id,
        task_id: updatedWorkLog.task_id,
        title: updatedWorkLog.title,
        description: updatedWorkLog.description,
        status: updatedWorkLog.status,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'WorkLog status update failed',
      });
    }
  }

  // // Get WorkLogs by UserId
  // async getWorkLogsByUserId(user_id: string): Promise<WorkLogResponseDto[]> {
  //   try {
  //     const workLogs = await this.prisma.workLog.findMany({
  //       where: { user_id },
  //     });
  //     return workLogs.map(workLog => ({
  //       worklog_id: workLog.worklog_id,
  //       task_id: workLog.task_id,
  //       title: workLog.title,
  //       description: workLog.description,
  //       status: workLog.status,
  //       created_at: workLog.created_at,
  //       updated_at: workLog.updated_at,
  //     }));
  //   } catch (error) {
  //     throw new RpcException({
  //       statusCode: 500,
  //       message: 'Error retrieving WorkLogs by UserId',
  //     });
  //   }
  // }
}