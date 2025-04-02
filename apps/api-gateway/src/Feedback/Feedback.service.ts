import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints';
import { FEEDBACK_PATTERN } from '@app/contracts/feedback/feedback.patterns';
import { FeedbackResponseDto } from '@app/contracts/feedback/feedback.dto';
import { CreateFeedbackDto } from '@app/contracts/feedback/create-feedback.dto';
import { UpdateFeedbackDto } from '@app/contracts/feedback/update-feedback.dto';
import { firstValueFrom } from 'rxjs';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { UpdateFeedbackRatingDto } from '@app/contracts/feedback/update-feedback-rating.dto';
import { UpdateFeedbackStatusDto } from '@app/contracts/feedback/update-feedback-status.dto';

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
  async getFeedbacksByUserId(feedback_by: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(FEEDBACK_PATTERN.GET_BY_USER_ID, { feedback_by }),
      );
      return response;
    } catch (error) {
      console.error('Error getting feedbacks by user ID:', error);
      throw error;
    }
  }
  async deleteFeedback(feedback_id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(FEEDBACK_PATTERN.DELETE, { feedback_id }),
      );
      return response;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }

  async getFeedbackById(feedback_id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(FEEDBACK_PATTERN.GET_BY_ID, { feedback_id }),
      );
      return response;
    } catch (error) {
      console.error('Error getting feedback by ID:', error);
      throw error;
    }
  }

  async updateFeedback(updateFeedbackDto: UpdateFeedbackDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(FEEDBACK_PATTERN.UPDATE, updateFeedbackDto),
      );
      return response;
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  async updateFeedbackrating(updateFeedbackStatusDto: UpdateFeedbackRatingDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(FEEDBACK_PATTERN.UPDATE_RATING, updateFeedbackStatusDto),
      );
      return response;
    } catch (error) {
      console.error('Error updating feedback rating:', error);
      throw error;
    }
  }

  async updateFeedbackStatus(updateFeedbackStatusDto: UpdateFeedbackStatusDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.taskClient.send(FEEDBACK_PATTERN.UPDATE_STATUS, updateFeedbackStatusDto),
      );
      return response;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw error;
    }
  }
  

} 