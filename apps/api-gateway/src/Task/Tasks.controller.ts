import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus, Inject,
  NotFoundException,
  Param, Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './Tasks.service';
import { catchError, firstValueFrom, NotFoundError } from 'rxjs';
import { UpdateTaskDto } from '@app/contracts/tasks/update.Task';
import { ApiOperation, ApiParam, ApiTags, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ChangeTaskStatusDto } from '@app/contracts/tasks/ChangeTaskStatus.Dto ';

import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints';
import { UpdateInspectionDto } from '../../../../libs/contracts/src/inspections/update-inspection.dto';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';

@Controller('tasks')
@ApiTags('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Post('task')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTask(@Body() createTaskDto: any) {
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

  // @Put('task/:task_id/status')
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
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'Returns all tasks' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getAllTasks(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    try {
      // Create pagination params object
      const paginationParams: PaginationParams = {
        page: page ? parseInt(page.toString()) : 1,
        limit: limit ? parseInt(limit.toString()) : 10
      };
      
      return this.taskService.getAllTasks(paginationParams);
    } catch (error) {
      console.error('Error in getAllTasks controller:', error);
      throw new Error(`Failed to get tasks: ${error.message}`);
    }
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get tasks by status' })
  @ApiParam({ name: 'status', description: 'Task status' })
  @ApiResponse({ status: 200, description: 'Returns tasks by status' })
  async getTasksByStatus(@Param('status') status: string) {
    return this.taskService.getTasksByStatus(status);
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
