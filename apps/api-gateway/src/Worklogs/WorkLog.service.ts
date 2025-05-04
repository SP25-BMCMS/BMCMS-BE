import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { WORKLOG_PATTERN } from '@app/contracts/Worklog/Worklog.patterns';
import { WorkLogResponseDto } from '@app/contracts/Worklog/Worklog.dto';
import { firstValueFrom } from 'rxjs';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { TASK_CLIENT } from '../constraints';
@Injectable()
export class WorklogService {
  constructor(@Inject(TASK_CLIENT) private readonly taskClient: ClientProxy) { }

  async createWorkLog(createWorkLogDto: any): Promise<WorkLogResponseDto> {
    const response = await firstValueFrom(
      this.taskClient.send(WORKLOG_PATTERN.CREATE, createWorkLogDto),
    );
    return response as WorkLogResponseDto; // Ensure the response is mapped to the correct type
  }

  async getWorkLogsByTaskId(task_id: string): Promise<WorkLogResponseDto[]> {
    const response = await firstValueFrom(
      this.taskClient.send(WORKLOG_PATTERN.GET_BY_TASK_ID, { task_id }),
    );
    return response as WorkLogResponseDto[];
  }

  async getWorkLogById(worklog_id: string): Promise<WorkLogResponseDto> {
    const response = await firstValueFrom(
      this.taskClient.send(WORKLOG_PATTERN.GET_BY_ID, { worklog_id }),
    );
    return response as WorkLogResponseDto;
  }

  async updateWorkLogStatus(
    worklog_id: string,
    status: string,
  ): Promise<WorkLogResponseDto> {
    console.log(
      '🚀 ~ WorklogService ~ updateWorkLogStatus ~ worklog_id:',
      worklog_id,
    );
    const updateWorkLogStatusDto = { worklog_id, status }; // Tạo đối tượng DTO với worklog_id và status
    const response = await firstValueFrom(
      this.taskClient.send(
        WORKLOG_PATTERN.UPDATE_STATUS,
        updateWorkLogStatusDto,
      ),
    );
    return response as WorkLogResponseDto;
  }

  async getAllWorkLogs(
    paginationParams: PaginationParams,
  ): Promise<WorkLogResponseDto[]> {
    try {
      return await firstValueFrom(
        this.taskClient.send(WORKLOG_PATTERN.GET, paginationParams),
      );
    } catch (error) {
      console.error('Error in getAllWorkLogs:', error);
      throw error;
    }
  }

  async getWorklogsByResidentId(resident_id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(WORKLOG_PATTERN.GET_BY_RESIDENT_ID, { residentId: resident_id }),
      );
      return response;
    } catch (error) {
      console.error('Error getting worklogs by resident ID:', error);
      throw error;
    }
  }

  async executeTask(taskAssignmentId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(WORKLOG_PATTERN.EXECUTE_TASK, { taskAssignmentId }),
      );
      return response;
    } catch (error) {
      console.error('Error executing task assignment:', error);
      if (error.statusCode === 404 || (error.response && error.response.statusCode === 404)) {
        const message = error.message || error.response?.message || 'Task assignment not found';
        throw new NotFoundException(message);
      }
      throw error;
    }
  }

  async cancelTask(taskAssignmentId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(WORKLOG_PATTERN.CANCEL_TASK, { taskAssignmentId }),
      );
      return response;
    } catch (error) {
      console.error('Error canceling task assignment:', error);
      if (error.statusCode === 404 || (error.response && error.response.statusCode === 404)) {
        const message = error.message || error.response?.message || 'Task assignment not found';
        throw new NotFoundException(message);
      }
      throw error;
    }
  }

  // async getWorkLogsByUserId(user_id: string): Promise<WorkLogResponseDto[]> {
  //   return await this.workLogClient.send(WORKLOG_PATTERN.GET_BY_USER_ID, { user_id });
  // }
}
