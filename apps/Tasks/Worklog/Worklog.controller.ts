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
        message: 'Lỗi khi lấy danh sách nhật ký công việc!',
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

  @MessagePattern(WORKLOG_PATTERN.GET_BY_RESIDENT_ID)
  async getWorklogsByResidentId(
    @Payload() payload: { residentId: string },
  ): Promise<ApiResponse<any[]>> {
    return this.workLogService.getWorklogsByResidentId(payload.residentId);
  }

  @MessagePattern(WORKLOG_PATTERN.EXECUTE_TASK)
  async executeTask(
    @Payload() payload: { taskAssignmentId: string },
  ): Promise<ApiResponse<any>> {
    try {
      return await this.workLogService.executeTask(payload.taskAssignmentId);
    } catch (error) {
      console.error('Error in executeTask:', error);

      // Preserve the original status code if it exists
      if (error instanceof RpcException) {
        // Just rethrow the RpcException as is
        throw error;
      }

      // Determine the appropriate status code
      const statusCode = error.statusCode ||
        (error.response && error.response.statusCode) ||
        500;

      throw new RpcException({
        statusCode: statusCode,
        message: error.message || 'Error executing task'
      });
    }
  }

  @MessagePattern(WORKLOG_PATTERN.CANCEL_TASK)
  async cancelTask(
    @Payload() payload: { taskAssignmentId: string },
  ): Promise<ApiResponse<any>> {
    try {
      return await this.workLogService.cancelTask(payload.taskAssignmentId);
    } catch (error) {
      console.error('Error in cancelTask:', error);

      // Preserve the original status code if it exists
      if (error instanceof RpcException) {
        // Just rethrow the RpcException as is
        throw error;
      }

      // Determine the appropriate status code
      const statusCode = error.statusCode ||
        (error.response && error.response.statusCode) ||
        500;

      throw new RpcException({
        statusCode: statusCode,
        message: error.message || 'Error canceling task'
      });
    }
  }

  @MessagePattern(WORKLOG_PATTERN.UPDATE_CRACK_STATUS_SILENT)
  async updateCrackStatusSilent(
    @Payload() payload: { crackReportId: string, status: string },
  ): Promise<any> {
    try {
      return await this.workLogService.updateCrackStatusSilent(payload.crackReportId, payload.status);
    } catch (error) {
      console.error('Error in updateCrackStatusSilent:', error);

      // Preserve the original status code if it exists
      if (error instanceof RpcException) {
        // Just rethrow the RpcException as is
        throw error;
      }

      // Determine the appropriate status code
      const statusCode = error.statusCode ||
        (error.response && error.response.statusCode) ||
        500;

      throw new RpcException({
        statusCode: statusCode,
        message: error.message || 'Error updating crack status silently'
      });
    }
  }

  //   @MessagePattern(WORKLOG_PATTERN.GET_BY_USER_ID)
  //   async getWorkLogsByUserId(@Payload() payload: { user_id: string }): Promise<WorkLogResponseDto[]> {
  //     return this.workLogService.getWorkLogsByUserId(payload.user_id);
}
