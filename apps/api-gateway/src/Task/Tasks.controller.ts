import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './Tasks.service';
import { catchError, firstValueFrom, NotFoundError } from 'rxjs';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(@Body() createTaskDto: any) {
    return this.taskService.createTask(createTaskDto);
  }

  @Put(':task_id')
  async updateTask(
    @Param('task_id') task_id: string,
    @Body() updateTaskDto: any,
  ) {
    return this.taskService.updateTask(task_id, updateTaskDto);
  }

  @Get(':task_id')
  async getTaskById(@Param('task_id') task_id: string) {
    return this.taskService.getTaskById(task_id);
  }

  @Delete(':task_id')
  async deleteTask(@Param('task_id') task_id: string) {
    return this.taskService.deleteTask(task_id);
  }

  @Put(':task_id/status')
  async changeTaskStatus(
    @Param('task_id') task_id: string,
    @Body() body: { status: string },
  ) {
    console.log(
      '🚀 ~ AreasController ~ changeTaskStatus ~ status:',
      body.status,
    );

    return this.taskService.changeTaskStatus(task_id, body.status);
  }

  @Get()
  async getAllTasks() {
    return this.taskService.getAllTasks();
  }

  @Get('status/:status')
  async getTasksByStatus(@Param('status') status: string) {
    return this.taskService.getTasksByStatus(status);
  }

  @Get('inspection/:task_assignment_id')
  async GetInspectionByTaskAssignmentId(
    @Param('task_assignment_id') task_assignment_id: string,
  ) {
    return this.taskService.GetInspectionByTaskAssignmentId(task_assignment_id);
  }
}
