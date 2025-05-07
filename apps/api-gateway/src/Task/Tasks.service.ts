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
import { CRACK_CLIENT, NOTIFICATION_CLIENT, TASK_CLIENT } from '../constraints';
import { TASKS_PATTERN } from 'libs/contracts/src/tasks/task.patterns';
import { catchError, firstValueFrom } from 'rxjs';
import { INSPECTIONS_PATTERN } from '../../../../libs/contracts/src/inspections/inspection.patterns';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { UpdateInspectionDto } from '../../../../libs/contracts/src/inspections/update-inspection.dto';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns';
import { NotificationType } from '@app/contracts/notifications/notification.dto';
import { GetTasksByTypeDto } from '@app/contracts/tasks/get-tasks-by-type.dto';
import { timeout } from 'rxjs';

// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'
@Injectable()
export class TaskService {
  constructor(
    @Inject(TASK_CLIENT) private readonly taskClient: ClientProxy,
    @Inject(CRACK_CLIENT) private readonly crackClient: ClientProxy,
    @Inject(NOTIFICATION_CLIENT) private readonly notificationClient: ClientProxy
  ) { }

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

  async deleteTaskAndRelated(task_id: string) {
    try {
      if (!task_id) {
        throw new HttpException(
          'Task ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(`[TaskService] Attempting to delete task and related data for ID: ${task_id}`);

      const response = await firstValueFrom(
        this.taskClient.send(
          TASKS_PATTERN.DELETE_AND_RELATED,
          { task_id }
        ).pipe(
          timeout(35000), // 35 second timeout (longer for complex deletion)
          catchError(err => {
            console.error(`[TaskService] Error from task microservice:`, err);

            // Check for specific error messages
            const errorMessage = err.message || 'Unknown error';

            if (errorMessage.includes('not found') || errorMessage.includes('không tìm thấy')) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.NOT_FOUND,
                  message: errorMessage,
                  error: 'Not Found'
                },
                HttpStatus.NOT_FOUND
              );
            }

            if (errorMessage.includes('UUID') || errorMessage.includes('định dạng')) {
              throw new HttpException(
                {
                  statusCode: HttpStatus.BAD_REQUEST,
                  message: errorMessage,
                  error: 'Bad Request'
                },
                HttpStatus.BAD_REQUEST
              );
            }

            throw new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: errorMessage,
                error: 'Internal Server Error'
              },
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );

      // If response is ApiResponse format with isSuccess flag
      if (response.hasOwnProperty('isSuccess')) {
        if (!response.isSuccess) {
          // Map error status appropriately
          let statusCode = HttpStatus.BAD_REQUEST;
          if (response.message && (response.message.includes('không tìm thấy') ||
            response.message.includes('not found'))) {
            statusCode = HttpStatus.NOT_FOUND;
          }

          throw new HttpException(
            {
              statusCode: statusCode,
              message: response.message,
              error: statusCode === HttpStatus.NOT_FOUND ? 'Not Found' : 'Bad Request'
            },
            statusCode
          );
        }

        return response;
      }

      return response;
    } catch (error) {
      console.error('[TaskService] Error in deleteTaskAndRelated:', error);

      // If the error is already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Determine appropriate status code
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      const errorMessage = error.message || 'Error occurred while deleting task and related data';

      if (errorMessage.includes('không tìm thấy') || errorMessage.includes('not found')) {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (errorMessage.includes('UUID') || errorMessage.includes('định dạng')) {
        statusCode = HttpStatus.BAD_REQUEST;
      }

      throw new HttpException(
        {
          statusCode: statusCode,
          message: errorMessage,
          error: statusCode === HttpStatus.NOT_FOUND ? 'Not Found' :
            statusCode === HttpStatus.BAD_REQUEST ? 'Bad Request' : 'Internal Server Error'
        },
        statusCode
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

  async notificationThankstoResident(taskId: string, scheduleJobId?: string) {
    try {
      console.log(`[TaskService] Sending thanks notification for task: ${taskId}, scheduleJob: ${scheduleJobId || 'N/A'}`);

      // Call the Task microservice to process the task and get resident information
      let taskResponse;
      try {
        taskResponse = await firstValueFrom(
          this.taskClient.send(
            TASKS_PATTERN.NOTIFICATION_THANKS_TO_RESIDENT,
            { taskId, scheduleJobId }
          ).pipe(
            catchError(error => {
              console.error('Error from task microservice:', error);
              throw new HttpException(
                `Failed to process notification: ${error.message || 'Unknown error'}`,
                HttpStatus.INTERNAL_SERVER_ERROR
              );
            })
          )
        );
      } catch (error) {
        console.error('[TaskService] Failed to get response from task microservice:', error);
        throw error;
      }

      // Check if the task microservice response was successful
      if (!taskResponse || !taskResponse.isSuccess) {
        throw new HttpException(
          taskResponse?.message || 'Failed to process task notification',
          HttpStatus.BAD_REQUEST
        );
      }

      // Extract data from response with fallbacks for missing fields
      const crackReportId = taskResponse.data?.crackReportId;
      const residentId = taskResponse.data?.residentId;
      const crackPosition = taskResponse.data?.crackPosition || 'unknown location';

      if (!crackReportId) {
        throw new HttpException('Missing crack report ID in task response', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (!residentId) {
        throw new HttpException('Missing resident ID in task response', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      console.log(`[TaskService] Task processed successfully. Resident ID: ${residentId}, Crack Report ID: ${crackReportId}, Position: ${crackPosition}`);

      // Make sure residentId is a string, not an object
      let userId = residentId;
      if (typeof userId === 'object' && userId !== null) {
        userId = userId.userId || userId.id;
        if (!userId) {
          throw new HttpException(
            'Invalid user ID in task response',
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }

      // Include the crack position in the notification content
      const locationText = crackPosition ? ` tại địa điểm "${crackPosition}"` : '';

      // Send notification to the resident
      const notificationData = {
        userId: userId, // Using the extracted userId string
        title: 'Cảm ơn bạn đã báo cáo vết nứt.',
        content: `Chúng tôi đã ghi nhận vết nứt${locationText}. Nó đã được đưa vào lịch trình bảo trì và đã được sửa chữa. Cảm ơn bạn đã đóng góp để duy trì tòa nhà an toàn và chất lượng.`,
        type: NotificationType.SYSTEM,
        relatedId: crackReportId,
        link: `/crack-reports/${crackReportId}`
      };

      console.log(`[TaskService] Sending notification with data:`, JSON.stringify(notificationData));

      try {
        await firstValueFrom(
          this.notificationClient.emit(
            NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION,
            notificationData
          )
        );
        console.log(`[TaskService] Notification sent to resident ${userId}`);
      } catch (notificationError) {
        console.error('[TaskService] Error sending notification:', notificationError);
        // Continue even if notification fails, as the task and crack have been updated
      }

      // Return success response
      return {
        success: true,
        message: 'Notification sent and statuses updated successfully',
        data: {
          taskId,
          scheduleJobId: scheduleJobId || taskResponse.data.scheduleJobId,
          crackReportId,
          residentId: userId,
          taskStatus: 'Completed',
          crackReportStatus: 'Completed'
        }
      };
    } catch (error) {
      console.error('[TaskService] Error in notificationThankstoResident:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to process notification and status updates',
          error: 'Notification Process Failed'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getTasksByType(query: GetTasksByTypeDto) {
    try {
      return await firstValueFrom(
        this.taskClient.send(
          TASKS_PATTERN.GET_BY_TYPE,
          query
        ).pipe(
          catchError(error => {
            console.error('Error from task microservice:', error);
            throw new HttpException(
              {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message || 'Failed to get tasks by type',
                error: 'Task Service Error'
              },
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );
    } catch (error) {
      console.error('Error in getTasksByType service:', error);
      throw error;
    }
  }

  async completeTaskAndReview(taskId: string) {
    try {
      return await firstValueFrom(
        this.taskClient.send(
          TASKS_PATTERN.COMPLETE_AND_REVIEW,
          { taskId }
        ).pipe(
          catchError(error => {
            console.error('Error from task microservice:', error);
            // If error has status code, use it, otherwise use 500
            const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

            throw new HttpException(
              {
                statusCode,
                message: error.message || 'Failed to complete task and update related entities',
                error: 'Task Update Failed'
              },
              statusCode
            );
          })
        )
      );
    } catch (error) {
      console.error('Error in completeTaskAndReview service:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to complete task and update to reviewing',
          error: 'Task Update Failed'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getLatestTaskAssignment(taskId: string) {
    try {
      // Validate taskId
      if (!taskId) {
        throw new HttpException(
          'Task ID is required',
          HttpStatus.BAD_REQUEST
        );
      }

      console.log(`[TaskService] Getting latest verified task assignment for task ID: ${taskId}`);

      // Call the Task microservice
      return await firstValueFrom(
        this.taskClient.send(
          TASKS_PATTERN.GET_LATEST_ASSIGNMENT,
          { taskId }
        ).pipe(
          timeout(15000), // 15 second timeout as we're fetching data from multiple sources
          catchError(error => {
            console.error('Error from task microservice:', error);

            // Check if the error is a "not found" error
            if (error.message && (
              error.message.includes('không tìm thấy') ||
              error.message.includes('not found')
            )) {
              throw new HttpException(
                error.message || 'Task or verified assignment not found',
                HttpStatus.NOT_FOUND
              );
            }

            throw new HttpException(
              error.message || 'Failed to get latest verified task assignment',
              error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );
    } catch (error) {
      console.error('Error in getLatestTaskAssignment service:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to get latest verified task assignment',
          error: 'Task Assignment Fetch Failed'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
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
