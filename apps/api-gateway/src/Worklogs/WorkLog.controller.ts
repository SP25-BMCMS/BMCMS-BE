// apps/api-gateway/src/worklog/worklog.controller.ts
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { WorklogService} from './WorkLog.service';

@Controller('worklogs')
export class WorkLogController {
  constructor(private readonly workLogService: WorklogService) {}

  @Post()
  async createWorkLog(@Body() createWorkLogDto: any) {
    return this.workLogService.createWorkLog(createWorkLogDto);
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

  @Post()
  async updateWorkLogStatus(@Body() updateWorkLogStatusDto: any) {
    return this.workLogService.updateWorkLogStatus(updateWorkLogStatusDto);
  }

  // @Get('user/:user_id')
  // async getWorkLogsByUserId(@Param('user_id') user_id: string) {
  //   return this.workLogService.getWorkLogsByUserId(user_id);
  // }
}
