import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints';
import { FEEDBACK_PATTERN } from '@app/contracts/feedback/feedback.patterns';
import { FeedbackResponseDto } from '@app/contracts/feedback/feedback.dto';
import { CreateFeedbackDto } from '@app/contracts/feedback/create-feedback.dto';
import { UpdateFeedbackDto } from '@app/contracts/feedback/update-feedback.dto';
import { firstValueFrom } from 'rxjs';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';

@Injectable()
export class FeedbackService {
  constructor(@Inject(TASK_CLIENT) private readonly taskClient: ClientProxy) {}

  async createFeedback(createFeedbackDto: CreateFeedbackDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(FEEDBACK_PATTERN.CREATE, createFeedbackDto),
      );
      return response;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  

  async getAllFeedbacks(paginationParams: PaginationParams): Promise<any> {
    try {
      return await firstValueFrom(
        this.taskClient.send(FEEDBACK_PATTERN.GET, paginationParams),
      );
    } catch (error) {
      console.error('Error getting all feedbacks:', error);
      throw error;
    }
  }
  async getFeedbacksByTaskId(task_id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(FEEDBACK_PATTERN.GET_BY_TASK_ID, { task_id }),
      );
      return response;
    } catch (error) {
      console.error('Error getting feedbacks by task ID:', error);
      throw error;
    }
  }


} 