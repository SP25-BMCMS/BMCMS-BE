import { Controller } from '@nestjs/common';
import { FeedbackService } from './Feedback.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { FEEDBACK_PATTERN } from '@app/contracts/feedback/feedback.patterns';
import { FeedbackResponseDto } from '@app/contracts/feedback/feedback.dto';
import { CreateFeedbackDto } from '@app/contracts/feedback/create-feedback.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { UpdateFeedbackDto } from '@app/contracts/feedback/update-feedback.dto';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { UpdateFeedbackRatingDto } from '@app/contracts/feedback/update-feedback-rating.dto';
import { UpdateFeedbackStatusDto } from '@app/contracts/feedback/update-feedback-status.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @MessagePattern(FEEDBACK_PATTERN.GET)
  async getAllFeedbacks(@Payload() paginationParams: PaginationParams) {
    try {
      return await this.feedbackService.getAllFeedbacks(paginationParams);
    } catch (error) {
      console.error('Error in getAllFeedbacks:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving feedbacks!',
      });
    }
  }

  @MessagePattern(FEEDBACK_PATTERN.CREATE)
  async createFeedback(
    @Payload() createFeedbackDto: CreateFeedbackDto,
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  @MessagePattern(FEEDBACK_PATTERN.GET_BY_TASK_ID)
  async getFeedbacksByTaskId(
    @Payload() payload: { task_id: string },
  ): Promise<ApiResponse<FeedbackResponseDto[]>> {
    return this.feedbackService.getFeedbacksByTaskId(payload.task_id);
  }
  @MessagePattern(FEEDBACK_PATTERN.GET_BY_USER_ID)
  async getFeedbacksByUserId(
    @Payload() payload: { feedback_by: string },
  ): Promise<ApiResponse<FeedbackResponseDto[]>> {
    return this.feedbackService.getFeedbacksByUserId(payload.feedback_by);
  }
  @MessagePattern(FEEDBACK_PATTERN.DELETE)
  async deleteFeedback(
    @Payload() payload: { feedback_id: string },
  ): Promise<ApiResponse<null>> {
    return this.feedbackService.deleteFeedback(payload.feedback_id);
  }



  @MessagePattern(FEEDBACK_PATTERN.GET_BY_ID)
  async getFeedbackById(
    @Payload() payload: { feedback_id: string },
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    return this.feedbackService.getFeedbackById(payload.feedback_id);
  }

  @MessagePattern(FEEDBACK_PATTERN.UPDATE_RATING)
  async updateFeedbackRating(
    @Payload() updateDto: { feedback_id: string, rating: number },
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    console.log('Updating feedback rating:', updateDto);
    
    return this.feedbackService.updateFeedbackRating(
      updateDto.feedback_id,
      updateDto.rating,
    );
  }

  @MessagePattern(FEEDBACK_PATTERN.UPDATE_STATUS)
  async updateFeedbackStatus(
    @Payload() updateStatusDto: UpdateFeedbackStatusDto,
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    console.log('Updating feedback status:', updateStatusDto);
    
    return this.feedbackService.updateFeedbackStatus(updateStatusDto);
  }
} 