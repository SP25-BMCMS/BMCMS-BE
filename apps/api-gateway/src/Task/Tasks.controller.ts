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
import { UpdateTaskDto } from '@app/contracts/tasks/update.Task';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { ChangeTaskStatusDto } from '@app/contracts/tasks/ChangeTaskStatus.Dto ';

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
    @Body() updateTaskDto: UpdateTaskDto,
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
  @ApiOperation({ summary: 'Change the status of a task' })
  @ApiParam({
    name: 'task_id',
    description: 'The ID of the task to update',
    type: String,
    example: 'abc123',  // Ví dụ về task_id
  })
  async changeTaskStatus(
    @Param('task_id') task_id: string,
    @Body() body: ChangeTaskStatusDto ,
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
