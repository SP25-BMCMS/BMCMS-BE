import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { CreateFeedbackDto } from '@app/contracts/feedback/create-feedback.dto';
import { FeedbackResponseDto } from '@app/contracts/feedback/feedback.dto';
import { UpdateFeedbackDto } from '@app/contracts/feedback/update-feedback.dto';
import { FeedbackStatus, UpdateFeedbackStatusDto } from '@app/contracts/feedback/update-feedback-status.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client-Task';
import { PrismaService } from '../../users/prisma/prisma.service';
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class FeedbackService {
  private prisma = new PrismaClient();

  constructor(private prismaService: PrismaService) {}

  // Create Feedback
  async createFeedback(
    createFeedbackDto: CreateFeedbackDto,
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    try {
      // Kiểm tra xem task có tồn tại không
      const taskExists = await this.prisma.task.findUnique({
        where: { task_id: createFeedbackDto.task_id },
      });

      if (!taskExists) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task not found',
        });
      }

      const newFeedback = await this.prisma.feedback.create({
        data: {
          task_id: createFeedbackDto.task_id,
          feedback_by: createFeedbackDto.feedback_by,
          comments: createFeedbackDto.comments,
          rating: createFeedbackDto.rating,
        },
      });

      return new ApiResponse<FeedbackResponseDto>(
        true,
        'Feedback created successfully',
        newFeedback,
      );
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 400,
        message: error.message || 'Failed to create feedback',
      });
    }
  }

  

  // Get All Feedbacks with Pagination
  async getAllFeedbacks(paginationParams?: PaginationParams) {
    try {
      // Default values if not provided
      const page = paginationParams?.page || 1;
      const limit = paginationParams?.limit || 10;
      const search = paginationParams?.search || '';

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Create where condition for search
      const where: any = {};
      if (search) {
        where.OR = [
          { comments: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get paginated data
      const [feedbacks, total] = await Promise.all([
        this.prisma.feedback.findMany({
          where,
          skip,
          take: limit,
          include: {
            task: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.feedback.count({ where }),
      ]);

      return {
        statusCode: 200,
        message: 'Feedbacks retrieved successfully',
        data: feedbacks,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    } catch (error) {
      console.error('Error retrieving feedbacks:', error);
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to retrieve feedbacks',
      });
    }
  }

  async getFeedbacksByTaskId(
    task_id: string,
  ): Promise<ApiResponse<FeedbackResponseDto[]>> {
    try {
      const feedbacks = await this.prisma.feedback.findMany({
        where: { task_id },
      });

      return new ApiResponse<FeedbackResponseDto[]>(
        true,
        'Feedbacks retrieved successfully',
        feedbacks,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to retrieve feedbacks by task ID',
      });
    }
  }
  async getFeedbacksByUserId(
    feedback_by: string,
  ): Promise<ApiResponse<FeedbackResponseDto[]>> {
    try {
      const feedbacks = await this.prisma.feedback.findMany({
        where: { feedback_by },
      });

      return new ApiResponse<FeedbackResponseDto[]>(
        true,
        'Feedbacks retrieved successfully',
        feedbacks,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to retrieve feedbacks by user ID',
      });
    }
  }
    // Delete Feedback
    async deleteFeedback(feedback_id: string): Promise<ApiResponse<null>> {
        try {
          // Kiểm tra xem feedback có tồn tại không
          const feedbackExists = await this.prisma.feedback.findUnique({
            where: { feedback_id },
          });
    
          if (!feedbackExists) {
            throw new RpcException({
              statusCode: 404,
              message: 'Feedback not found',
            });
          }
    
          await this.prisma.feedback.delete({
            where: { feedback_id },
          });
    
          return new ApiResponse<null>(
            true,
            'Feedback deleted successfully',
            null,
          );
        } catch (error) {
          if (error instanceof RpcException) {
            throw error;
          }
          throw new RpcException({
            statusCode: 400,
            message: error.message || 'Failed to delete feedback',
          });
        }
      }
    
      // Get Feedback by ID
      async getFeedbackById(
        feedback_id: string,
      ): Promise<ApiResponse<FeedbackResponseDto>> {
        try {
          const feedback = await this.prisma.feedback.findUnique({
            where: { feedback_id },
          });
    
          if (!feedback) {
            throw new RpcException({
              statusCode: 404,
              message: 'Feedback not found',
            });
          }
    
          return new ApiResponse<FeedbackResponseDto>(
            true,
            'Feedback retrieved successfully',
            feedback,
          );
        } catch (error) {
          if (error instanceof RpcException) {
            throw error;
          }
          throw new RpcException({
            statusCode: 500,
            message: error.message || 'Failed to retrieve feedback',
          });
        }
      }

  // Update Feedback Status
  async updateFeedbackStatus(
    updateStatusDto: UpdateFeedbackStatusDto,
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    try {
      const { feedback_id, status } = updateStatusDto;

      // Kiểm tra xem feedback có tồn tại không
      const feedbackExists = await this.prisma.feedback.findUnique({
        where: { feedback_id },
      });

      if (!feedbackExists) {
        throw new RpcException({
          statusCode: 404,
          message: 'Feedback not found',
        });
      }

      // Cập nhật trạng thái
      const updatedFeedback = await this.prisma.feedback.update({
        where: { feedback_id },
        data: { 
          status: status as any 
        },
      });

      return new ApiResponse<FeedbackResponseDto>(
        true,
        `Feedback status updated to ${status} successfully`,
        updatedFeedback,
      );
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to update feedback status',
      });
    }
  }

  // Update Feedback Rating
  async updateFeedbackRating(
    feedback_id: string,
    rating: number,
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    try {
      // Kiểm tra xem feedback có tồn tại không
      const feedbackExists = await this.prisma.feedback.findUnique({
        where: { feedback_id },
      });

      if (!feedbackExists) {
        throw new RpcException({
          statusCode: 404,
          message: 'Feedback not found',
        });
      }

      // Kiểm tra rating hợp lệ không (1-5)
      if (rating < 1 || rating > 5) {
        throw new RpcException({
          statusCode: 400,
          message: 'Rating must be between 1 and 5',
        });
      }

      // Cập nhật rating của feedback
      const updatedFeedback = await this.prisma.feedback.update({
        where: { feedback_id },
        data: { rating },
      });

      return new ApiResponse<FeedbackResponseDto>(
        true,
        'Feedback rating updated successfully',
        updatedFeedback,
      );
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 400,
        message: error.message || 'Failed to update feedback rating',
      });
    }
  }
} 