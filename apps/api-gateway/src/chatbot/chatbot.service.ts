import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, throwError, lastValueFrom } from 'rxjs';
import { ChatMessageDto, ChatListQueryDto, ResultModel } from '@app/contracts/chatbot/chatbot.dto';
import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.patterns';
import { SignalRService } from '../signalr/signalr.service';

@Injectable()
export class ChatbotService implements OnModuleInit {
  private readonly logger = new Logger(ChatbotService.name);
  private isConnected = false;

  constructor(
    @Inject('CHATBOT_CLIENT') private readonly chatbotClient: ClientProxy,
    private readonly signalRService: SignalRService,
  ) {
    this.logger.log('ChatbotService initialized');
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
    }
  }

  async testChat(message: string): Promise<string> {
    this.logger.log(`[testChat] Starting with message: "${message}"`);
    console.log("🚀 ~ ChatbotService ~ testChat ~ message:", message);

    try {
      // Kiểm tra client đã được khởi tạo hay chưa
      if (!this.chatbotClient) {
        this.logger.error('[testChat] Chatbot client is not initialized');
        throw new Error('Chatbot client is not initialized');
      }

      // Thử kết nối lại nếu chưa kết nối
      if (!this.isConnected) {
        try {
          this.logger.log('[testChat] Attempting to reconnect to chatbot service...');
          await this.chatbotClient.connect();
          this.isConnected = true;
          this.logger.log('[testChat] Reconnected to chatbot service');
        } catch (connError) {
          this.logger.error('[testChat] Failed to reconnect:', connError);
        }
      }

      // Tạo payload
      const payload = { message };
      this.logger.log(`[testChat] Sending payload: ${JSON.stringify(payload)}`);
      this.logger.log(`[testChat] Using pattern: { cmd: 'test_chat' }`);
      
      // Gửi request với timeout và error handling
      const response = await firstValueFrom(
        this.chatbotClient
          .send(CHATBOT_PATTERN.TEST_CHAT, payload)
          .pipe(
            timeout(150000), // Tăng timeout lên 15 giây
            catchError(error => {
              this.logger.error('[testChat] Error in request:', error);
              return throwError(() => new Error(`Failed to get response from chatbot service: ${error.message}`));
            })
          )
      );

      // Kiểm tra response
      if (!response) {
        this.logger.error('[testChat] No response received from chatbot service');
        throw new Error('No response received from chatbot service');
      }

      this.logger.log(`[testChat] Received response: "${response}"`);
      return response;
    } catch (error) {
      this.logger.error('[testChat] Error:', error);
      throw error;
    }
  }

  async getUserChats(query: ChatListQueryDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.chatbotClient.send(CHATBOT_PATTERN.GET_USER_CHATS, query)
      );
      return response;
    } catch (error) {
      this.logger.error(`Error getting user chats: ${error.message}`);
      throw error;
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