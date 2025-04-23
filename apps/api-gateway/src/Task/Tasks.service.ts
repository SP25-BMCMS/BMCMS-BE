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
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
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

  async createTaskForScheduleJob(scheduleJobId: string, staffId: string) {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(
          { cmd: 'create-task-for-schedule-job' },
          { scheduleJobId, staffId }
        ).pipe(
          catchError(error => {
            // Extract error details from RPC exception
            console.error('Error from task microservice:', error);

            // Kiểm tra lỗi trực tiếp từ RpcException
            if (error.response && typeof error.response === 'object') {
              const { statusCode = 500, message = 'Unknown error' } = error.response;
              console.log(`Direct RPC statusCode: ${statusCode}, message: ${message}`);

              // Map statusCode từ RpcException sang HttpException
              throw new HttpException(
                {
                  statusCode,
                  message,
                  error: statusCode === 404 ? 'Resource Not Found' : 'Bad Request'
                },
                statusCode
              );
            }

            // Kiểm tra statusCode trực tiếp nếu có
            if (error.statusCode === 404 || (error.error && error.error.statusCode === 404)) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.NOT_FOUND,
                  message: error.message || error.error?.message || 'Resource not found',
                  error: 'Resource Not Found'
                },
                HttpStatus.NOT_FOUND
              );
            }

            // Kiểm tra format UUID error
            if (error.message && (
              error.message.includes('không đúng định dạng UUID') ||
              error.message.includes('UUID format') ||
              error.message.includes('định dạng')
            )) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.BAD_REQUEST,
                  message: error.message,
                  error: 'Invalid UUID Format'
                },
                HttpStatus.BAD_REQUEST
              );
            }

            // Kiểm tra nếu lỗi có cấu trúc error.error.message (RpcException với ApiResponse)
            if (error.error && error.error.message) {
              // Xác định HTTP status code dựa trên nội dung lỗi
              let statusCode = HttpStatus.BAD_REQUEST;

              if (error.error.message.includes('không tồn tại') ||
                error.error.message.includes('not found')) {
                statusCode = HttpStatus.NOT_FOUND;
              } else if (error.error.message.includes('không đúng định dạng')) {
                statusCode = HttpStatus.BAD_REQUEST;
              }

              throw new HttpException(
                {
                  statusCode: statusCode,
                  message: error.error.message,
                  error: 'Task Creation Failed'
                },
                statusCode
              );
            }

            // Check if error contains message about staff area not matching
            if (error.message && error.message.includes('không thuộc khu vực')) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.BAD_REQUEST,
                  message: error.message,
                  error: 'Staff Area Mismatch'
                },
                HttpStatus.BAD_REQUEST
              );
            }

            // Check if error is an ApiResponse object directly
            if (error.isSuccess === false && error.message) {
              // Map error messages to appropriate HTTP status codes
              let statusCode = HttpStatus.BAD_REQUEST;

              if (error.message.includes('không tồn tại') ||
                error.message.includes('not found')) {
                statusCode = HttpStatus.NOT_FOUND;
              } else if (error.message.includes('không đúng định dạng') ||
                error.message.includes('định dạng UUID') ||
                error.message.includes('bắt buộc') ||
                error.message.includes('không thuộc khu vực')) {
                statusCode = HttpStatus.BAD_REQUEST;
              }

              throw new HttpException(
                {
                  statusCode: statusCode,
                  message: error.message,
                  error: 'Task Creation Failed'
                },
                statusCode
              );
            }

            // Check for not found errors
            if (error.message && (error.message.includes('không tồn tại') || error.message.includes('not found'))) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.NOT_FOUND,
                  message: error.message,
                  error: 'Not Found'
                },
                HttpStatus.NOT_FOUND
              );
            }

            // Check if error contains message about not found resources
            if (error.message && (
              error.message.includes('không tìm thấy') ||
              error.message.includes('not found') ||
              error.message.match(/Không tìm thấy (nhân viên|lịch công việc|tòa nhà|khu vực)/)
            )) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.NOT_FOUND,
                  message: error.message,
                  error: 'Resource Not Found'
                },
                HttpStatus.NOT_FOUND
              );
            }

            // Các lỗi "không tồn tại" cũng map về 404
            if (error.message && error.message.includes('không tồn tại')) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.NOT_FOUND,
                  message: error.message,
                  error: 'Resource Not Found'
                },
                HttpStatus.NOT_FOUND
              );
            }

            // Default error handling
            const errorMessage = error.message || 'Unknown error from task service';

            // Check for area mismatch error messages
            if (errorMessage.includes('không phù hợp với khu vực') ||
              errorMessage.includes('không thuộc khu vực')) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.BAD_REQUEST,
                  message: errorMessage,
                  error: 'Staff Area Mismatch'
                },
                HttpStatus.BAD_REQUEST
              );
            }

            if (errorMessage.includes('Chỉ nhân viên kỹ thuật bảo trì') ||
              errorMessage.includes('mới có thể thực hiện công việc này')) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.BAD_REQUEST,
                  message: errorMessage,
                  error: ''
                },
                HttpStatus.BAD_REQUEST
              );
            }
            throw new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: errorMessage,
                error: 'Task Creation Failed'
              },
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );

      return response;
    } catch (error) {
      // If error is already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Determine appropriate HTTP status code for other errors
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      const errorMessage = error.message || 'Error occurred while creating task for schedule job';

      if (errorMessage.includes('không tồn tại') ||
        errorMessage.includes('not found')) {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (errorMessage.includes('không đúng định dạng') ||
        errorMessage.includes('định dạng UUID') ||
        errorMessage.includes('bắt buộc') ||
        errorMessage.includes('không phù hợp với khu vực') ||
        errorMessage.includes('không thuộc khu vực')) {
        statusCode = HttpStatus.BAD_REQUEST;
      }

      // Fallback error handler
      throw new HttpException(
        {
          statusCode: statusCode,
          message: errorMessage,
          error: 'Task Creation Failed'
        },
        statusCode
      );
    }
  }

  // async createRepairMaterial(createRepairMaterialDto: CreateRepairMaterialDto) {
  //   try {
  //     return await this.taskClient.send(
  //       TASKS_PATTERN.CREATE_REPAIR_MATERIAL,
  //       createRepairMaterialDto
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       'Error occurred while creating repair material',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}
