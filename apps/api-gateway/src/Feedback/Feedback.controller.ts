import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Query,
  Param, 
} from '@nestjs/common';
import { FeedbackService } from './Feedback.service';
import { CreateFeedbackDto } from '@app/contracts/feedback/create-feedback.dto';
import { UpdateFeedbackDto } from '@app/contracts/feedback/update-feedback.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';

@Controller('feedbacks')
@ApiTags('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new feedback' })
  @ApiBody({ type: CreateFeedbackDto })
  @ApiResponse({ status: 201, description: 'Feedback created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all feedbacks with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  async getAllFeedbacks(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.feedbackService.getAllFeedbacks({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @Get('task/:task_id')
  @ApiOperation({ summary: 'Get feedbacks by task ID' })
  @ApiParam({ name: 'task_id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Returns feedbacks for the task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getFeedbacksByTaskId(@Param('task_id') task_id: string) {
    return this.feedbackService.getFeedbacksByTaskId(task_id);
  }
  @Get('user/:feedback_by')
  @ApiOperation({ summary: 'Get feedbacks by user ID' })
  @ApiParam({ name: 'feedback_by', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns feedbacks for the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFeedbacksByUserId(@Param('feedback_by') feedback_by: string) {
    return this.feedbackService.getFeedbacksByUserId(feedback_by);
  }

} 