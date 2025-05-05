import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { CreateFeedbackDto } from '@app/contracts/feedback/create-feedback.dto'
import { FeedbackResponseDto } from '@app/contracts/feedback/feedback.dto'
import { UpdateFeedbackDto } from '@app/contracts/feedback/update-feedback.dto'
import { UpdateFeedbackRatingDto } from '@app/contracts/feedback/update-feedback-rating.dto'
import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { PrismaClient } from '@prisma/client-Task'
import { PrismaService } from '../../users/prisma/prisma.service'
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto'
import { UpdateFeedbackStatusDto } from '@app/contracts/feedback/update-feedback-status.dto'

@Injectable()
export class FeedbackService {
  private prisma = new PrismaClient();

  constructor(private prismaService: PrismaService) { }

  // Create Feedback
  async createFeedback(
    createFeedbackDto: CreateFeedbackDto,
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    try {
      // Kiểm tra xem task có tồn tại không
      const taskExists = await this.prisma.task.findUnique({
        where: { task_id: createFeedbackDto.task_id },
      })

      if (!taskExists) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy nhiệm vụ',
        })
      }

      const newFeedback = await this.prisma.feedback.create({
        data: {
          task_id: createFeedbackDto.task_id,
          feedback_by: createFeedbackDto.feedback_by,
          comments: createFeedbackDto.comments,
          rating: createFeedbackDto.rating,
        },
      })

      return new ApiResponse<FeedbackResponseDto>(
        true,
        'Tạo phản hồi thành công',
        newFeedback,
      )
    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 400,
        message: error.message || 'Không thể tạo phản hồi',
      })
    }
  }

  // Get All Feedbacks with Pagination
  async getAllFeedbacks(paginationParams?: PaginationParams) {
    try {
      // Default values if not provided
      const page = paginationParams?.page || 1
      const limit = paginationParams?.limit || 10
      const search = paginationParams?.search || ''

      // Calculate skip value for pagination
      const skip = (page - 1) * limit

      // Create where condition for search
      const where: any = {}
      if (search) {
        where.OR = [
          { comments: { contains: search, mode: 'insensitive' } },
        ]
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
      ])

      return {
        statusCode: 200,
        message: 'Lấy danh sách phản hồi thành công',
        data: feedbacks,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      }
    } catch (error) {
      console.error('Error retrieving feedbacks:', error)
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Không thể lấy danh sách phản hồi',
      })
    }
  }

  async getFeedbacksByTaskId(
    task_id: string,
  ): Promise<ApiResponse<FeedbackResponseDto[]>> {
    try {
      const feedbacks = await this.prisma.feedback.findMany({
        where: { task_id },
      })

      return new ApiResponse<FeedbackResponseDto[]>(
        true,
        'Lấy danh sách phản hồi thành công',
        feedbacks,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Không thể lấy danh sách phản hồi theo ID nhiệm vụ',
      })
    }
  }

  async getFeedbacksByUserId(
    feedback_by: string,
  ): Promise<ApiResponse<FeedbackResponseDto[]>> {
    try {
      const feedbacks = await this.prisma.feedback.findMany({
        where: { feedback_by },
      })

      return new ApiResponse<FeedbackResponseDto[]>(
        true,
        'Lấy danh sách phản hồi thành công',
        feedbacks,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Không thể lấy danh sách phản hồi theo ID người dùng',
      })
    }
  }

  // Delete Feedback
  async deleteFeedback(feedback_id: string): Promise<ApiResponse<null>> {
    try {
      // Kiểm tra xem feedback có tồn tại không
      const feedbackExists = await this.prisma.feedback.findUnique({
        where: { feedback_id },
      })

      if (!feedbackExists) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy phản hồi',
        })
      }

      await this.prisma.feedback.delete({
        where: { feedback_id },
      })

      return new ApiResponse<null>(
        true,
        'Xóa phản hồi thành công',
        null,
      )
    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 400,
        message: error.message || 'Không thể xóa phản hồi',
      })
    }
  }

  // Get Feedback by ID
  async getFeedbackById(
    feedback_id: string,
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    try {
      const feedback = await this.prisma.feedback.findUnique({
        where: { feedback_id },
      })

      if (!feedback) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy phản hồi',
        })
      }

      return new ApiResponse<FeedbackResponseDto>(
        true,
        'Lấy thông tin phản hồi thành công',
        feedback,
      )
    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Không thể lấy thông tin phản hồi',
      })
    }
  }

  // Update Feedback Status
  async updateFeedbackStatus(
    updateStatusDto: UpdateFeedbackStatusDto,
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    try {
      const { feedback_id, status } = updateStatusDto

      // Kiểm tra xem feedback có tồn tại không
      const feedbackExists = await this.prisma.feedback.findUnique({
        where: { feedback_id },
      })

      if (!feedbackExists) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy phản hồi',
        })
      }

      // Cập nhật trạng thái
      const updatedFeedback = await this.prisma.feedback.update({
        where: { feedback_id },
        data: {
          status: status as any
        },
      })

      return new ApiResponse<FeedbackResponseDto>(
        true,
        `Cập nhật trạng thái phản hồi thành ${status} thành công`,
        updatedFeedback,
      )
    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Không thể cập nhật trạng thái phản hồi',
      })
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
      })

      if (!feedbackExists) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy phản hồi',
        })
      }

      // Kiểm tra rating hợp lệ không (1-5)
      if (rating < 1 || rating > 5) {
        throw new RpcException({
          statusCode: 400,
          message: 'Đánh giá phải từ 1 đến 5',
        })
      }

      // Cập nhật rating của feedback
      const updatedFeedback = await this.prisma.feedback.update({
        where: { feedback_id },
        data: { rating },
      })

      return new ApiResponse<FeedbackResponseDto>(
        true,
        'Cập nhật đánh giá phản hồi thành công',
        updatedFeedback,
      )
    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 400,
        message: error.message || 'Không thể cập nhật đánh giá phản hồi',
      })
    }
  }

  async updateFeedback(
    updateFeedbackDto: UpdateFeedbackDto,
  ): Promise<ApiResponse<FeedbackResponseDto>> {
    try {
      const { feedback_id, ...updateData } = updateFeedbackDto

      // Kiểm tra xem feedback có tồn tại không
      const feedbackExists = await this.prisma.feedback.findUnique({
        where: { feedback_id },
      })

      if (!feedbackExists) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy phản hồi',
        })
      }

      const updatedFeedback = await this.prisma.feedback.update({
        where: { feedback_id },
        data: updateData,
      })

      return new ApiResponse<FeedbackResponseDto>(
        true,
        'Cập nhật phản hồi thành công',
        updatedFeedback,
      )
    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 400,
        message: error.message || 'Không thể cập nhật phản hồi',
      })
    }
  }
} 