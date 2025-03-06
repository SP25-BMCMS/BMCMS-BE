import { Controller, Param } from '@nestjs/common';
import { WorkLogService } from './Worklog.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WORKLOG_PATTERN } from '@app/contracts/Worklog/Worklog.patterns';
import { WorkLogResponseDto } from '@app/contracts/Worklog/Worklog.dto';
import { CreateWorkLogDto } from '@app/contracts/Worklog/create-Worklog.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
@Controller('worklogs')
export class WorkLogController {
  constructor(private readonly workLogService: WorkLogService) {}

  @MessagePattern(WORKLOG_PATTERN.CREATE)
  async createWorkLog(@Payload() createWorkLogDto: CreateWorkLogDto): Promise<ApiResponse<WorkLogResponseDto>> {
    return this.workLogService.createWorkLogForTask(createWorkLogDto);
  }

  @MessagePattern(WORKLOG_PATTERN.GET_BY_TASK_ID)
  async getWorkLogsByTaskId(@Payload() payload: { task_id: string }): Promise<WorkLogResponseDto[]> {
    return this.workLogService.getWorkLogsByTaskId(payload.task_id);
  }

  @MessagePattern(WORKLOG_PATTERN.GET_BY_ID)
  async getWorkLogById(@Payload() payload: { worklog_id: string }): Promise<WorkLogResponseDto> {
    return this.workLogService.getWorkLogById(payload.worklog_id);
  }

  @MessagePattern(WORKLOG_PATTERN.UPDATE_STATUS)
  async updateWorkLogStatus(@Payload() payload: any): Promise<WorkLogResponseDto> {
    return this.workLogService.updateWorkLogStatus(payload);
  }

//   @MessagePattern(WORKLOG_PATTERN.GET_BY_USER_ID)
//   async getWorkLogsByUserId(@Payload() payload: { user_id: string }): Promise<WorkLogResponseDto[]> {
//     return this.workLogService.getWorkLogsByUserId(payload.user_id);
  }