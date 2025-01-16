import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaskAssignmentsService } from './task-assignments.service';
import { CreateTaskAssignmentDto } from './dto/create-task-assignment.dto';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto';

@Controller('task-assignments')
export class TaskAssignmentsController {
  constructor(private readonly taskAssignmentsService: TaskAssignmentsService) {}

  @Post()
  create(@Body() createTaskAssignmentDto: CreateTaskAssignmentDto) {
    return this.taskAssignmentsService.create(createTaskAssignmentDto);
  }

  @Get()
  findAll() {
    return this.taskAssignmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskAssignmentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskAssignmentDto: UpdateTaskAssignmentDto) {
    return this.taskAssignmentsService.update(+id, updateTaskAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskAssignmentsService.remove(+id);
  }
}
