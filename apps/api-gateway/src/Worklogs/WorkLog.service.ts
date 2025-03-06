import {
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints';
import { WORKLOG_PATTERN } from '@app/contracts/Worklog/Worklog.patterns';
import { WorkLogResponseDto } from '@app/contracts/Worklog/Worklog.dto';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class WorklogService {
  constructor(@Inject(TASK_CLIENT) private readonly taskClient: ClientProxy) {}

  async createWorkLog(createWorkLogDto: any): Promise<WorkLogResponseDto> {
    const response = await firstValueFrom(this.taskClient.send(WORKLOG_PATTERN.CREATE, createWorkLogDto));
    return response as WorkLogResponseDto; // Ensure the response is mapped to the correct type
 }

  async getWorkLogsByTaskId(task_id: string): Promise<WorkLogResponseDto[]> {
    const response = await firstValueFrom(this.taskClient.send(WORKLOG_PATTERN.GET_BY_TASK_ID, { task_id }));
    return response as WorkLogResponseDto [];
  
  }

  async getWorkLogById(worklog_id: string): Promise<WorkLogResponseDto> {
    const response = await firstValueFrom(this.taskClient.send(WORKLOG_PATTERN.GET_BY_ID, { worklog_id }));
    return response as WorkLogResponseDto;   }

    

  async updateWorkLogStatus(updateWorkLogStatusDto: any): Promise<WorkLogResponseDto> {
    const response = await firstValueFrom(this.taskClient.send(WORKLOG_PATTERN.UPDATE_STATUS, updateWorkLogStatusDto));
    return response as WorkLogResponseDto; 
    }

  // async getWorkLogsByUserId(user_id: string): Promise<WorkLogResponseDto[]> {
  //   return await this.workLogClient.send(WORKLOG_PATTERN.GET_BY_USER_ID, { user_id });
  // }
}
