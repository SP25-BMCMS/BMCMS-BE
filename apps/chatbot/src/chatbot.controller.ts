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
  }

  @MessagePattern(CHATBOT_PATTERN.CHAT)
  async chat(@Payload() message: ChatMessageDto) {
    this.logger.log(`[chat] Received message: ${JSON.stringify(message)}`);
    return this.chatbotService.createChat(message);
  }

  // @MessagePattern(CHATBOT_PATTERN.SYSTEM_INFO)
  // async getSystemInfo() {
  //   return this.chatbotService.getSystemInfo();
  // }

  @MessagePattern(CHATBOT_PATTERN.TEST_CHAT)
  async testChat(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const pattern = context.getPattern();

    this.logger.log(`[testChat] Received message with pattern: ${JSON.stringify(pattern)}`);
    this.logger.log(`[testChat] Received data: ${JSON.stringify(data)}`);
    
    console.log("🚀 ~ ChatbotControllerChatbotControllerChatbotControllerChatbotControllerChatbotController ~ testChat ~ data:", data)
    try {
      // Kiểm tra và xử lý data
      if (!data) {
        this.logger.error('[testChat] No data received');
        throw new Error('No data received');
      }

      let message: string;
      
      // Xử lý các trường hợp có thể có của dữ liệu đầu vào
      if (typeof data === 'string') {
        message = data;
        this.logger.log(`[testChat] Received string message: ${message}`);
      } else if (typeof data === 'object') {
        if (data.message) {
          message = data.message;
          this.logger.log(`[testChat] Extracted message from object: ${message}`);
        } else {
          message = JSON.stringify(data);
          this.logger.log(`[testChat] Converted object to string: ${message}`);
        }
      } else {
        message = String(data);
        this.logger.log(`[testChat] Converted data to string: ${message}`);
      }

      // Gọi service để xử lý message
      this.logger.log(`[testChat] Processing message: "${message}"`);
      const response = await this.chatbotService.testChat(message);
      
      this.logger.log(`[testChat] Response: "${response}"`);
      
      // Xác nhận message đã được xử lý
      channel.ack(originalMsg);
      
      return response;
    } catch (error) {
      this.logger.error(`[testChat] Error processing message:`, error);
      // Xác nhận message để không retry vô tận
      channel.ack(originalMsg);
      throw error;
    }
  }
} 