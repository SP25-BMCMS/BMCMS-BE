import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  HttpException,
  Version
} from '@nestjs/common';
import { TaskService } from './Tasks.service';
import { catchError, firstValueFrom, NotFoundError } from 'rxjs';
import { UpdateTaskDto } from '@app/contracts/tasks/update.Task';
import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChangeTaskStatusDto } from '@app/contracts/tasks/ChangeTaskStatus.Dto ';
import { CreateTaskDto } from '@app/contracts/tasks/create-Task.dto';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints';
import { UpdateInspectionDto } from '../../../../libs/contracts/src/inspections/update-inspection.dto';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { Status } from '@prisma/client-Task';
import { GetTasksByTypeDto } from '@app/contracts/tasks/get-tasks-by-type.dto';
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard';

@Controller('tasks')
@ApiTags('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Post('task')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: CreateTaskDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.createTask(createTaskDto);
  }

  @Put('task/:task_id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'task_id', description: 'Task ID' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateTask(
    @Param('task_id') task_id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(task_id, updateTaskDto);
  }

  @Get('task/:task_id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'task_id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task found' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskById(@Param('task_id') task_id: string) {
    return this.taskService.getTaskById(task_id);
  }

  @Delete('task/:task_id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'task_id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async deleteTask(@Param('task_id') task_id: string) {
    return this.taskService.deleteTask(task_id);
  }

  @Delete('task/:task_id/cascade')
  @ApiOperation({
    summary: 'Delete a task and all related data',
    description: 'Performs a cascading delete of a task and all related records including task assignments, work logs, and feedback. Also updates related crack reports and schedule jobs to Pending status.'
  })
  @ApiParam({ name: 'task_id', description: 'Task ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Task and all related data deleted successfully',
    schema: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Nhiệm vụ và tất cả dữ liệu liên quan đã được xóa thành công' },
        data: {
          type: 'object',
          properties: {
            task: { type: 'object', description: 'Deleted task data' },
            relatedData: {
              type: 'object',
              properties: {
                taskAssignments: { type: 'number', example: 2, description: 'Number of task assignments deleted' },
                workLogs: { type: 'number', example: 3, description: 'Number of work logs deleted' },
                feedbacks: { type: 'number', example: 1, description: 'Number of feedback entries deleted' },
                crackReportUpdated: { type: 'boolean', example: true, description: 'Whether crack report was updated' },
                scheduleJobUpdated: { type: 'boolean', example: true, description: 'Whether schedule job was updated' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid task ID format' })
  @ApiResponse({ status: 500, description: 'Internal server error during deletion process' })
  @HttpCode(HttpStatus.OK)
  async deleteTaskAndRelated(@Param('task_id') task_id: string) {
    try {
      return await this.taskService.deleteTaskAndRelated(task_id);
    } catch (error) {
      console.error('Error in deleteTaskAndRelated controller:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error deleting task and related data: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('task/:task_id/status')
  @ApiOperation({ summary: 'Change task status' })
  @ApiParam({ name: 'task_id', description: 'Task ID' })
  @ApiBody({ type: ChangeTaskStatusDto })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async changeTaskStatus(
    @Param('task_id') task_id: string,
    @Body() body: ChangeTaskStatusDto,
  ) {
    console.log(
      '🚀 ~ AreasController ~ changeTaskStatus ~ status:',
      body.status,
    );

    return this.taskService.changeTaskStatus(task_id, body.status);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get all tasks with pagination and status filter' })
  @ApiResponse({ status: 200, description: 'Returns all tasks' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starting from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'statusFilter',
    required: false,
    type: String,
    description: 'Filter by task status',
    enum: Status,
  })
  async getAllTasks(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('statusFilter') statusFilter?: Status,
  ) {
    try {
      // Create pagination params object
      const paginationParams: PaginationParams = {
        page: page ? parseInt(page.toString()) : 1,
        limit: limit ? parseInt(limit.toString()) : 10,
        statusFilter,
      };

      return this.taskService.getAllTasks(paginationParams);
    } catch (error) {
      console.error('Error in getAllTasks controller:', error);
      throw new Error(`Failed to get tasks: ${error.message}`);
    }
  }

  // @Get('status/:status')
  // @ApiOperation({ summary: 'Get tasks by status' })
  // @ApiParam({ name: 'status', description: 'Task status' })
  // @ApiResponse({ status: 200, description: 'Returns tasks by status' })
  // async getTasksByStatus(@Param('status') status: string) {
  //   return this.taskService.getTasksByStatus(status);
  // }

  @Post('schedule-job/:scheduleJobId/staff/:staffId')
  @ApiOperation({ summary: 'Create task for schedule job' })
  @ApiParam({ name: 'scheduleJobId', description: 'Schedule Job ID' })
  @ApiParam({ name: 'staffId', description: 'Staff ID' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation error, UUID format error, or staff area mismatch' })
  @ApiResponse({ status: 404, description: 'Not found - Schedule job or staff not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createTaskForScheduleJob(
    @Param('scheduleJobId') scheduleJobId: string,
    @Param('staffId') staffId: string
  ) {
    try {
      if (!scheduleJobId || !staffId) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'scheduleJobId và staffId là bắt buộc',
            error: 'Validation Error'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Gọi service nếu các tham số đúng
      const result = await this.taskService.createTaskForScheduleJob(scheduleJobId, staffId);
      return result;
    } catch (error) {
      console.error('Controller error:', error);
      // Nếu đã là HttpException thì chỉ cần ném lại
      if (error instanceof HttpException) {
        throw error;
      }

      // Xác định loại lỗi dựa trên thông báo lỗi
      const errorMessage = error.message || 'Unknown error';

      // Phân loại lỗi "không tìm thấy" sang 404
      if (errorMessage.includes('không tìm thấy') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('không tồn tại')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: errorMessage,
            error: 'Resource Not Found'
          },
          HttpStatus.NOT_FOUND
        );
      }

      if (errorMessage.includes('không đúng định dạng') || errorMessage.includes('UUID')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: errorMessage,
            error: 'Invalid Format'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Lỗi mặc định
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
          error: 'Internal Server Error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('notification-thanks-to-resident')
  @ApiOperation({ summary: 'Send notification to resident and update task and crack report status' })
  @ApiResponse({ status: 200, description: 'Notification sent and statuses updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required parameters' })
  @ApiResponse({ status: 404, description: 'Not found - Task or crack report not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['taskId'],
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
        scheduleJobId: { type: 'string', description: 'Schedule Job ID' }
      }
    }
  })
  async notificationThankstoResident(
    @Body() body: { taskId: string; scheduleJobId?: string }
  ) {
    try {
      if (!body.taskId) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'taskId is required',
            error: 'Validation Error'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.taskService.notificationThankstoResident(body.taskId, body.scheduleJobId);
      return result;
    } catch (error) {
      console.error('Controller error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage = error.message || 'Unknown error';

      // Handle various error types
      if (errorMessage.includes('not found') || errorMessage.includes('không tìm thấy')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: errorMessage,
            error: 'Resource Not Found'
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Default to internal server error
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
          error: 'Internal Server Error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // @Post('repair-materials')
  // @ApiOperation({ summary: 'Create repair material' })
  // @ApiBody({ type: CreateRepairMaterialDto })
  // @ApiResponse({ status: 201, description: 'Repair material created successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // async createRepairMaterial(@Body() createRepairMaterialDto: CreateRepairMaterialDto) {
  //   return this.taskService.createRepairMaterial(createRepairMaterialDto);
  // }

  @Get('tasks/by-type')
  @ApiBearerAuth('access-token')

  @ApiOperation({ summary: 'Get tasks by type (crack, schedule, or all) with optional filtering by manager ID' })
  @ApiResponse({ status: 200, description: 'Returns tasks filtered by type and optionally by manager' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseGuards(PassportJwtAuthGuard)
  async getTasksByType(@Query() query: GetTasksByTypeDto, @Req() req) {
    try {
      // Thêm log chi tiết hơn để xác nhận thông tin người dùng
      console.log('[TaskController] req.user structure:', JSON.stringify(req.user, null, 2));
      console.log('[TaskController] Request headers:', JSON.stringify(req.headers, null, 2));

      // Use authenticated user ID as manager ID if not provided in query
      if (!query.managerId && req.user) {
        // Truy cập userId theo cấu trúc đúng của đối tượng user
        // Có thể là req.user.userId, req.user.id, req.user.sub tùy theo cấu hình JWT
        const userId = req.user.userId || req.user.id || req.user.sub;

        if (userId) {
          query.managerId = userId;
          console.log(`Using authenticated user ID as manager ID: ${query.managerId}`);
        } else {
          console.log('User is authenticated but no userId found in token payload');
        }
      } else if (!query.managerId) {
        console.log('No managerId provided and user is not authenticated');
      }

      return this.taskService.getTasksByType(query);
    } catch (error) {
      console.error('Error in getTasksByType controller:', error);
      throw new Error(`Failed to get tasks: ${error.message}`);
    }
  }

  @Post('task/:task_id/complete-and-review')
  @ApiOperation({ summary: 'Set task to Completed and update related entities to Reviewing' })
  @ApiParam({ name: 'task_id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task and related entities updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async completeTaskAndReview(@Param('task_id') task_id: string) {
    try {
      return this.taskService.completeTaskAndReview(task_id);
    } catch (error) {
      console.error('Error in completeTaskAndReview controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error while updating task status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
