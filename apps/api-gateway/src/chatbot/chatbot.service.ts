import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, throwError, lastValueFrom } from 'rxjs';
import { ChatMessageDto, ChatListQueryDto, ResultModel } from '@app/contracts/chatbot/chatbot.dto';
import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.patterns';
import { SignalRService } from '../signalr/signalr.service';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class ChatbotService implements OnModuleInit {
  private readonly logger = new Logger(ChatbotService.name);
  private isConnected = false;

  constructor(
    @Inject('CHATBOT_CLIENT') private readonly chatbotClient: ClientProxy,
    private readonly signalRService: SignalRService,
  ) {
    this.logger.log('ChatbotService initialized');
    this.logger.log(`TEST_CHAT pattern: ${CHATBOT_PATTERN.TEST_CHAT}`);
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to chatbot service...');
      await this.chatbotClient.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to chatbot service');
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to connect to chatbot service:', error);
      throw error;
    }
  }

  async testChat(message: string, userId: string): Promise<string> {
    if (!this.chatbotClient) {
      this.logger.error('Chatbot client is not initialized');
      throw new HttpException(
        'Chatbot service is not available',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    this.logger.log(`Sending message to chatbot service: ${message} from user ${userId}`);
    
    try {
      const response = await this.chatbotClient
        .send<string>(CHATBOT_PATTERN.TEST_CHAT, { message, userId })
        .pipe(
          timeout(15000),
          catchError((error) => {
            this.logger.error('Error in testChat:', error);
            throw new HttpException(
              error.message || 'Failed to get response from chatbot service',
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
        .toPromise();

      if (!response) {
        throw new HttpException(
          'No response from chatbot service',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.log(`Received response from chatbot service: ${response}`);
      return response;
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

  async getUserChats(userId: string, query: ChatListQueryDto): Promise<any> {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Getting chat history for user ${userId}`);
      const response = await firstValueFrom(
        this.chatbotClient.send(CHATBOT_PATTERN.GET_USER_CHATS, { userId, ...query })
      );
      this.logger.log(`Found ${response?.length || 0} chat messages`);
      return response;
    } catch (error) {
      this.logger.error(`Error getting user chats: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get chat history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createChat(command: ChatMessageDto): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.chatbotClient.send(CHATBOT_PATTERN.CHAT, command)
      );
      return response;
    } catch (error) {
      this.logger.error(`Error creating chat: ${error.message}`);
      throw error;
    }
  }

  async generateContent(request: ChatMessageDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.chatbotClient.send(CHATBOT_PATTERN.GENERATE_CONTENT, request)
      );

      // Send response via SignalR
      const message = {
        messageId: crypto.randomUUID(),
        sender: 'BuildingAI',
        content: response,
      };

      try {
        await this.signalRService.sendToUser(request.userId, 'ReceiveMessage', message);
        this.logger.log(`Message sent to user ${request.userId} via SignalR`);
      } catch (signalrError) {
        this.logger.error(`Error sending SignalR message: ${signalrError.message}`);
        // Continue even if SignalR fails
      }

      return response;
    } catch (error) {
      this.logger.error(`Error generating content: ${error.message}`);
      throw error;
    }
  }

  async scanImage(image: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.chatbotClient.send(CHATBOT_PATTERN.SCAN_IMAGE, image)
      );
      return response;
    } catch (error) {
      this.logger.error(`Error scanning image: ${error.message}`);
      throw error;
    }
  }
} 