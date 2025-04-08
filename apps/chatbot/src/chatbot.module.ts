import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { GeminiService } from './utils/gemini.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, GeminiService],
  exports: [ChatbotService],
})
export class ChatbotModule implements OnModuleInit {
  private readonly logger = new Logger(ChatbotModule.name);
  
  constructor(private configService: ConfigService) {}
  
  async onModuleInit() {
    this.logger.log('Chatbot Module initializing...');
    
    // Log RabbitMQ details
    const queueName = this.configService.get('RABBITMQ_QUEUE_NAME') || 'chatbot_queue';
    const host = this.configService.get('RABBITMQ_HOST') || 'localhost';
    const port = this.configService.get('RABBITMQ_PORT') || '5672';
    
    this.logger.log(`RabbitMQ Queue: ${queueName}`);
    this.logger.log(`RabbitMQ Host: ${host}:${port}`);
    
    // Kiểm tra Gemini API key
    const geminiApiKey = this.configService.get('GEMINI_API_KEY');
    if (geminiApiKey) {
      this.logger.log('Gemini API Key is configured');
    } else {
      this.logger.warn('Gemini API Key is not configured. Chatbot will use fallback responses.');
    }
    
    this.logger.log('Chatbot Module initialized successfully');
  }
} 