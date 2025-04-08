import { Controller, Post, Body, Get, UseGuards, Query, Req, Logger, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto, ChatListQueryDto } from '@app/contracts/chatbot/chatbot.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard';
import { Request } from 'express';

@ApiTags('Chatbot')
@Controller('api/v1/chats')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  // @UseGuards(PassportJwtAuthGuard)
  @Post('test/:userId')
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Test chatbot with a simple message' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns chatbot response' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'xin chào',
          description: 'Message to send to chatbot'
        }
      }
    }
  })
  async testChat(
    @Param('userId') userId: string,
    @Body() body: { message: string }
  ) {
    try {
      if (!body?.message) {
        throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
      }

      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Received test message from user ${userId}: ${body.message}`);
      const response = await this.chatbotService.testChat(body.message, userId);
      this.logger.log(`Chatbot response: ${response}`);
      return { message: response };
    } catch (error) {
      this.logger.error('Error in testChat:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to test chat',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get chat history by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns chat history' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getHistoryChatByUserId(
    @Param('userId') userId: string,
    @Query() query: ChatListQueryDto
  ) {
    console.log("🚀 ~ ChatbotControlChatbotControllerChatbotControllerChatbotControllerChatbotControllerChatbotControllerler ~ query:", query.page, query.limit)
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }
      

      this.logger.log(`Getting chat history for user ${userId}`);
      const response = await this.chatbotService.getUserChats(userId, query);
      this.logger.log(`Found ${response.length} chat messages`);
      return response;
    } catch (error) {
      this.logger.error('Error in getHistoryChatByUserId:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get chat history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 