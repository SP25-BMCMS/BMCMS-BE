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
  Req,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './Tasks.service';
import { catchError, firstValueFrom, NotFoundError } from 'rxjs';
import { UpdateTaskDto } from '@app/contracts/tasks/update.Task';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { ChangeTaskStatusDto } from '@app/contracts/tasks/ChangeTaskStatus.Dto ';

import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints';
import { UpdateInspectionDto } from '../../../../libs/contracts/src/inspections/update-inspection.dto';
import { CreateRepairMaterialDto } from 'libs/contracts/src/tasks/create-repair-material.dto';
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Post('task')
  async createTask(@Body() createTaskDto: any) {
    return this.taskService.createTask(createTaskDto);
  }

  @Put('task/:task_id')
  async updateTask(
    @Param('task_id') task_id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(task_id, updateTaskDto);
  }

  @Get('task/:task_id')
  async getTaskById(@Param('task_id') task_id: string) {
    return this.taskService.getTaskById(task_id);
  }

  @Delete('task/:task_id')
  async deleteTask(@Param('task_id') task_id: string) {
    return this.taskService.deleteTask(task_id);
  }

  // @Put('task/:task_id/status')
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

  @Get('tasks')
  async getAllTasks() {
    return this.taskService.getAllTasks();
  }

  @Get('status/:status')
  async getTasksByStatus(@Param('status') status: string) {
    return this.taskService.getTasksByStatus(status);
  }

  @Get('inspection/task_assignment/:task_assignment_id')
  async GetInspectionByTaskAssignmentId(
    @Param('task_assignment_id') task_assignment_id: string,
  ) {
    return this.taskService.GetInspectionByTaskAssignmentId(task_assignment_id);
  }

  @Patch('inspection/:id')
  async updateCrackReport(@Param('id') inspection_id: string, @Body() dto: UpdateInspectionDto) {
    return this.taskService.updateInspection(inspection_id, dto);
  }

  @Get('inspection/crack/:crack_id')
  async GetInspectionByCrackId(
    @Param('crack_id') crack_id: string,
  ) {
    return this.taskService.GetInspectionByCrackId(crack_id);
  }

  @Get('inspections')
  async GetAllInspections() {
    return this.taskService.GetAllInspections();
  }

  @Post('repair-materials')
  async createRepairMaterial(@Body() createRepairMaterialDto: CreateRepairMaterialDto) {
    return this.taskService.createRepairMaterial(createRepairMaterialDto);
  }
}
