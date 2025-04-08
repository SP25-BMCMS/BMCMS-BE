import { Controller, Param } from '@nestjs/common'
import { WorkLogService } from './Worklog.service'
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices'
import { WORKLOG_PATTERN } from '@app/contracts/Worklog/Worklog.patterns'
import { WorkLogResponseDto } from '@app/contracts/Worklog/Worklog.dto'
import { CreateWorkLogDto } from '@app/contracts/Worklog/create-Worklog.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { UpdateWorkLogStatusDto } from '@app/contracts/Worklog/update.Worklog-status'
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
@Controller('worklogs')
export class WorkLogController {
  constructor(private readonly workLogService: WorkLogService) { }
  @MessagePattern(WORKLOG_PATTERN.GET)
  async getAllWorkLogs(@Payload() paginationParams: PaginationParams) {
    try {
      console.log(
        '🚀 ~ WorkLogController ~ getAllWorkLogs ~ paginationParams:',
        paginationParams,
      )
      return await this.workLogService.getAllWorklogs(paginationParams)
    } catch (error) {
      console.error('Error in getAllWorkLogs:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving worklogs!',
      })
    }
  }
  @MessagePattern(WORKLOG_PATTERN.CREATE)
  async createWorkLog(
    @Payload() createWorkLogDto: CreateWorkLogDto,
  ): Promise<ApiResponse<WorkLogResponseDto>> {
    return this.workLogService.createWorkLogForTask(createWorkLogDto)
  }

  @MessagePattern(WORKLOG_PATTERN.GET_BY_TASK_ID)
  async getWorkLogsByTaskId(
    @Payload() payload: { task_id: string },
  ): Promise<ApiResponse<WorkLogResponseDto[]>> {
    return this.workLogService.getWorkLogsByTaskId(payload.task_id)
  }

  @MessagePattern(WORKLOG_PATTERN.GET_BY_ID)
  async getWorkLogById(
    @Payload() payload: { worklog_id: string },
  ): Promise<ApiResponse<WorkLogResponseDto>> {
    return this.workLogService.getWorkLogById(payload.worklog_id)
  }

  @MessagePattern(WORKLOG_PATTERN.UPDATE_STATUS) // Sử dụng pattern để xử lý
  async updateWorkLogStatus(updateWorkLogStatusDto: UpdateWorkLogStatusDto) {
    console.log(
      '🚀 ~ updateWorkLogStatus ~ UpdateWorkLogStatusDto:',
      updateWorkLogStatusDto,
    )
    // Truyền dữ liệu vào service để cập nhật trạng thái
    return this.workLogService.updateWorkLogStatus(updateWorkLogStatusDto)
  }

  //   @MessagePattern(WORKLOG_PATTERN.GET_BY_USER_ID)
  //   async getWorkLogsByUserId(@Payload() payload: { user_id: string }): Promise<WorkLogResponseDto[]> {
  //     return this.workLogService.getWorkLogsByUserId(payload.user_id);
}
