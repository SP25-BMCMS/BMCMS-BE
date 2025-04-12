import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto } from '@app/contracts/chatbot/chatbot.dto';
import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.patterns';
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns';

@Controller()
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService ) {
    this.logger.log('ChatbotController initialized - ready to receive messages');
    this.logger.log(`Listening for TEST_CHAT pattern: "${CHATBOT_PATTERN.TEST_CHAT}"`);
  }

  // @MessagePattern(CHATBOT_PATTERN.CHAT)
  // async chat(@Payload() message: ChatMessageDto, @Ctx() context: RmqContext) {
  //   const channel = context.getChannelRef();
  //   const originalMsg = context.getMessage();
    
  //   this.logger.log(`[chat] Received message: ${JSON.stringify(message)}`);
    
  //   try {
  //     // Xử lý message trước
  //     const result = await this.chatbotService.createChat(message);
      
  //     // Xác nhận message sau khi xử lý xong và trước khi return
  //     try {
  //       channel.ack(originalMsg);
  //       this.logger.log('[chat] Message acknowledged successfully');
  //     } catch (ackError) {
  //       this.logger.error(`[chat] Error acknowledging message:`, ackError);
  //     }
      
  //     return result;
  //   } catch (error) {
  //     this.logger.error(`[chat] Error processing message:`, error);
      
  //     // Vẫn cố gắng xác nhận để tránh retry vô tận
  //     try {
  //       channel.ack(originalMsg);
  //       this.logger.log('[chat] Message acknowledged despite error');
  //     } catch (ackError) {
  //       this.logger.error(`[chat] Error acknowledging message after error:`, ackError);
  //     }
      
  //     throw error;
  //   }
  // }

  @MessagePattern(CHATBOT_PATTERN.GET_USER_CHATS)
  async getUserChats(@Payload() data: { userId: string; page: number; limit: number }, @Ctx() context: RmqContext) {
    const pattern = context.getPattern();

    this.logger.log(`[getUserChats] Received message with pattern: ${pattern}`);
    this.logger.log(`[getUserChats] Received data: ${JSON.stringify(data)}`);
    
    try {
      // Validate input
      if (!data) {
        this.logger.error('[getUserChats] No data received');
        throw new Error('No data received');
      }

      if (!data.userId) {
        this.logger.error('[getUserChats] No userId provided');
        throw new Error('No userId provided');
      }

      // Convert page and limit to numbers and set default values
      const page = data.page ? Number(data.page) : 1;
      const limit = data.limit ? Number(data.limit) : 10;

      // Validate page and limit
      if (isNaN(page) || page < 1) {
        this.logger.error('[getUserChats] Invalid page number');
        throw new Error('Invalid page number');
      }

      if (isNaN(limit) || limit < 1) {
        this.logger.error('[getUserChats] Invalid limit number');
        throw new Error('Invalid limit number');
      }

      // Get user chat history
      this.logger.log(`[getUserChats] Getting chat history for user ${data.userId}, page ${page}, limit ${limit}`);
      const chatHistory = await this.chatbotService.getUserChats(data.userId, page, limit);
      
      this.logger.log(`[getUserChats] Found ${chatHistory.length} chat messages`);
      
      return chatHistory;
    } catch (error) {
      this.logger.error(`[getUserChats] Error processing message:`, error);
      throw error;
    }
  }

  @MessagePattern(CHATBOT_PATTERN.TEST_CHAT)
  async testChat(@Payload() data: { message: string; userId: string }, @Ctx() context: RmqContext) {
    const pattern = context.getPattern();

    this.logger.log(`[testChat] Received message with pattern: ${pattern}`);
    this.logger.log(`[testChat] Received data: ${JSON.stringify(data)}`);
    
    try {
      // Kiểm tra và xử lý data
      if (!data) {
        this.logger.error('[testChat] No data received');
        throw new Error('No data received');
      }

      if (!data.message) {
        this.logger.error('[testChat] No message provided');
        throw new Error('No message provided');
      }

      if (!data.userId) {
        this.logger.error('[testChat] No userId provided');
        throw new Error('No userId provided');
      }

      // Gọi service để xử lý message
      this.logger.log(`[testChat] Processing message: "${data.message}" for user ${data.userId}`);
      const response = await this.chatbotService.testChat(data.message, data.userId);
      
      this.logger.log(`[testChat] Response: "${response}"`);
      
      return response;
    } catch (error) {
      this.logger.error(`[testChat] Error processing message:`, error);
      throw error;
    }
  }
} 