// apps/api-gateway/src/worklog/worklog.controller.ts
import { Controller, Post, Get, Body, Param, Put, Query } from '@nestjs/common';
import { WorklogService } from './WorkLog.service';
import { $Enums } from '@prisma/client-Task'
import { CreateWorkLogDto } from '@app/contracts/Worklog/create-Worklog.dto';
import { UpdateWorkLogDto } from '@app/contracts/Worklog/update.Worklog';
import { UpdateWorkLogStatusDto } from '@app/contracts/Worklog/update.Worklog-status';
import { WorkLogResponseDto } from '@app/contracts/Worklog/Worklog.dto';
import { IsUUID } from 'class-validator';
import { UUID } from 'crypto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';

@Controller('worklogs')
@ApiTags('worklogs')
export class WorkLogController {
  constructor(private readonly workLogService: WorklogService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new worklog' })
  @ApiBody({ type: CreateWorkLogDto })
  @ApiResponse({ status: 201, description: 'Worklog created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createWorkLog(@Body() createWorkLogDto: CreateWorkLogDto) {
    return this.workLogService.createWorkLog(createWorkLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all worklogs with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page' })
  async getAllWorkLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return await this.workLogService.getAllWorkLogs({
      page: Number(page) || 1,
      limit: Number(limit) || 10
    });
  }

  // @Get()
  // async getWorkLogs() {
  //   return this.workLogService.;
  // }

  @Get('task/:task_id')
  @ApiOperation({ summary: 'Get worklogs by task ID' })
  @ApiParam({ name: 'task_id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Returns worklogs for the task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getWorkLogsByTaskId(@Param('task_id') task_id: string) {
    return this.workLogService.getWorkLogsByTaskId(task_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get worklog by ID' })
  @ApiParam({ name: 'id', description: 'Worklog ID' })
  @ApiResponse({ status: 200, description: 'Worklog found' })
  @ApiResponse({ status: 404, description: 'Worklog not found' })
  async getWorkLogById(@Param('id') id: string) {
    return this.workLogService.getWorkLogById(id);
  }

  // @Put('update-status/:updateWorkLogStatusDto')
  //  updateWorkLogStatus(@Body() updateWorkLogStatusDto: any) {
  //   return this.workLogService.updateWorkLogStatus(updateWorkLogStatusDto);
  // }
  @Put('status/:worklog_idd')
  @ApiOperation({ summary: 'Update worklog status' })
  @ApiParam({ name: 'worklog_idd', description: 'Worklog ID' })
  @ApiBody({ type: UpdateWorkLogStatusDto })
  @ApiResponse({ status: 200, description: 'Worklog status updated successfully' })
  @ApiResponse({ status: 404, description: 'Worklog not found' })
  updateWorkLogStatus(
    @Param('worklog_idd') worklog_id: string,  // Validating the worklog_id as a UUID
    @Body() updateWorkLogDto: UpdateWorkLogStatusDto
  ) {
    return this.workLogService.updateWorkLogStatus(worklog_id, updateWorkLogDto.status);
  }

  // @Get('user/:user_id')
  // async getWorkLogsByUserId(@Param('user_id') user_id: string) {
  //   return this.workLogService.getWorkLogsByUserId(user_id);
  // }
}
