import { Controller, Post, Body, Get, UseGuards, Query, Req, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto, ChatListQueryDto } from '@app/contracts/chatbot/chatbot.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    sub: string;
  };
}

@ApiTags('Chatbot')
@ApiBearerAuth()
@Controller('api/v1/chats')
// @UseGuards(PassportJwtAuthGuard)
// @ApiBearerAuth('access-token')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('user')
  @ApiOperation({ summary: 'Get user chat history' })
  @ApiResponse({ status: 200, description: 'Returns user chat history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getUserChats(@Req() req: RequestWithUser, @Query() query: ChatListQueryDto) {
    try {
      this.logger.debug('Request user:', req.user);
      
      if (!req.user) {
        this.logger.error('User not found in request');
        throw new HttpException('User not found in request', HttpStatus.UNAUTHORIZED);
      }

      const userId = req.user.id || req.user.sub;
      this.logger.debug('Extracted userId:', userId);

      if (!userId) {
        this.logger.error('UserId not found in user object');
        throw new HttpException('UserId not found in user object', HttpStatus.UNAUTHORIZED);
      }

      return this.chatbotService.getUserChats({ ...query, userId });
    } catch (error) {
      this.logger.error('Error in getUserChats:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get user chats',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({ status: 201, description: 'Chat created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createChat(@Req() req: RequestWithUser, @Body() command: ChatMessageDto) {
    try {
      this.logger.debug('Request user:', req.user);
      
      if (!req.user) {
        this.logger.error('User not found in request');
        throw new HttpException('User not found in request', HttpStatus.UNAUTHORIZED);
      }

      const userId = req.user.id || req.user.sub;
      this.logger.debug('Extracted userId:', userId);

      if (!userId) {
        this.logger.error('UserId not found in user object');
        throw new HttpException('UserId not found in user object', HttpStatus.UNAUTHORIZED);
      }

      const chatId = await this.chatbotService.createChat({ ...command, userId });
      return { id: chatId };
    } catch (error) {
      this.logger.error('Error in createChat:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create chat',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('Building-ai')
  @ApiOperation({ summary: 'Chat with AI about the system' })
  @ApiResponse({ status: 200, description: 'Returns AI response about the system' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async chatWithBuildingAI(@Req() req: RequestWithUser, @Body() request: ChatMessageDto) {
    const userId = req.user.id || req.user.sub;
    return this.chatbotService.generateContent({ ...request, userId });
  }

  @Post('system-ai')
  @ApiOperation({ summary: 'Chat with AI about cracks' })
  @ApiResponse({ status: 200, description: 'Returns AI response about cracks' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async chatWithSystemAI(@Req() req: RequestWithUser, @Body() request: ChatMessageDto) {
    const userId = req.user.id || req.user.sub;
    return this.chatbotService.generateContent({ ...request, userId });
  }

  @Post('test')
  @ApiOperation({ summary: 'Test chatbot with a simple message' })
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
  async testChat(@Body() body: { message: string }) {
    try {
      if (!body?.message) {
        throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Received test message: ${body.message}`);
      const response = await this.chatbotService.testChat(body.message);
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
} 