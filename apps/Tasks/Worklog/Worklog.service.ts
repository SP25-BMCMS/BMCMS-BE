import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { CreateWorkLogDto } from '@app/contracts/Worklog/create-Worklog.dto';
import { UpdateWorkLogDto } from '@app/contracts/Worklog/update.Worklog';
import { UpdateWorkLogStatusDto } from '@app/contracts/Worklog/update.Worklog-status';
import { WorkLogResponseDto } from '@app/contracts/Worklog/Worklog.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client-Task';
import { $Enums } from '@prisma/client-Task';
import { PrismaService } from '../../users/prisma/prisma.service';
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class WorkLogService {
  private prisma = new PrismaClient();

  constructor(private prismaService: PrismaService) {}

  // Create WorkLog for Task
  async createWorkLogForTask(
    createWorkLogForTaskDto: CreateWorkLogDto,
  ): Promise<ApiResponse<WorkLogResponseDto>> {
    try {
      const newWorkLog = await this.prisma.workLog.create({
        data: {
          task_id: createWorkLogForTaskDto.task_id,
          title: createWorkLogForTaskDto.title,
          description: createWorkLogForTaskDto.description,
          status: $Enums.WorkLogStatus.INIT_INSPECTION,
        },
      });
      return new ApiResponse<WorkLogResponseDto>(
        true,
        'WorkLog created successfully',
        newWorkLog,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: error.message,
      });
    }
  }

  // Get WorkLogs by TaskId
  async getWorkLogsByTaskId(
    task_id: string,
  ): Promise<ApiResponse<WorkLogResponseDto[]>> {
    try {
      const workLogs = await this.prisma.workLog.findMany({
        where: { task_id },
      });
      return new ApiResponse<WorkLogResponseDto[]>(
        true,
        'get WorkLog by taskId  successfully',
        workLogs,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving WorkLogs by TaskId',
      });
    }
  }

  // Get WorkLog by ID
  async getWorkLogById(
    worklog_id: string,
  ): Promise<ApiResponse<WorkLogResponseDto>> {
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
      return new ApiResponse<WorkLogResponseDto>(
        true,
        'WorkLog By Id successfully',
        workLog,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving WorkLog by ID',
      });
    }
  }

  // Update WorkLog Status
  async updateWorkLogStatus(
    updateWorkLogStatusDto: UpdateWorkLogStatusDto,
  ): Promise<ApiResponse<WorkLogResponseDto>> {
    try {
      const { worklog_id, status } = updateWorkLogStatusDto;
      console.log(
        '🚀 ~ WorkLogService ~ updateWorkLogStatus ~ worklog_id:',
        worklog_id,
      );

      const updatedWorkLog = await this.prisma.workLog.update({
        where: { worklog_id: updateWorkLogStatusDto.worklog_id },
        data: {
          status: updateWorkLogStatusDto.status,
        },
      });
      return new ApiResponse<WorkLogResponseDto>(
        true,
        'WorkLog Update successfully',
        updatedWorkLog,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'WorkLog status update failed',
      });
    }
  }

  async getAllWorklogs(paginationParams?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      // Default values if not provided
      const page = paginationParams?.page || 1;
      const limit = paginationParams?.limit || 10;
      const search = paginationParams?.search || '';

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Create where condition for search
      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get paginated data
      const [worklogs, total] = await Promise.all([
        this.prisma.workLog.findMany({
          where,
          skip,
          take: limit,
          include: {
            task: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.workLog.count({ where }),
      ]);

      if (worklogs.length === 0) {
        return {
          statusCode: 200,
          message: 'No worklogs found',
          data: [],
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        };
      }

      return {
        statusCode: 200,
        message: 'Worklogs retrieved successfully',
        data: worklogs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    } catch (error) {
      console.error('Error retrieving worklogs:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving worklogs!',
      });
    }
  }
}
