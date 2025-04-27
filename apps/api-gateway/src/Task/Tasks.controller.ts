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
}
