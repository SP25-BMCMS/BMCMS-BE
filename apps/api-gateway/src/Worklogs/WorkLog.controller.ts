// apps/api-gateway/src/worklog/worklog.controller.ts
import { Controller, Post, Get, Body, Param, Put } from '@nestjs/common';
import { WorklogService} from './WorkLog.service';
import {$Enums} from '@prisma/client-Task'
import { CreateWorkLogDto } from '@app/contracts/Worklog/create-Worklog.dto';
import { UpdateWorkLogDto } from '@app/contracts/Worklog/update.Worklog';
import { UpdateWorkLogStatusDto } from '@app/contracts/Worklog/update.Worklog-status';
import { WorkLogResponseDto } from '@app/contracts/Worklog/Worklog.dto';
import { IsUUID } from 'class-validator';
import { UUID } from 'crypto';

@Controller('worklogs')
export class WorkLogController {
  constructor(private readonly workLogService: WorklogService) {}

  @Post()
  async createWorkLog(@Body() createWorkLogDto: CreateWorkLogDto) {
    return this.workLogService.createWorkLog(createWorkLogDto);
  }
  @Get()
  async getAllWorkLogs(): Promise<WorkLogResponseDto[]> {
    return this.workLogService.getAllWorkLogs();
  }

  // @Get()
  // async getWorkLogs() {
  //   return this.workLogService.;
  // }

  @Get('task/:task_id')
  async getWorkLogsByTaskId(@Param('task_id') task_id: string) {
    return this.workLogService.getWorkLogsByTaskId(task_id);
  }

  @Get(':id')
  async getWorkLogById(@Param('id') id: string) {
    return this.workLogService.getWorkLogById(id);
  }

  // @Put('update-status/:updateWorkLogStatusDto')
  //  updateWorkLogStatus(@Body() updateWorkLogStatusDto: any) {
  //   return this.workLogService.updateWorkLogStatus(updateWorkLogStatusDto);
  // }
     @Put('status/:worklog_idd')
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
