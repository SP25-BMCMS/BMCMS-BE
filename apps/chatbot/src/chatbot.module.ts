import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { GeminiService } from './utils/gemini.service';
import { CHATBOT_CLIENT } from 'apps/api-gateway/src/constraints';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { ClientConfigModule } from 'apps/configs/client-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ClientConfigModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, GeminiService,  {
        provide: CHATBOT_CLIENT,
        useFactory: (configService: ClientConfigService) => {
          const clientOptions = configService.chatbotClientOptions;
          return ClientProxyFactory.create(clientOptions);
        },
        inject: [ClientConfigService],
      },
    ],
  exports: [ChatbotService],
})
export class ChatbotModule implements OnModuleInit {
  private readonly logger = new Logger(ChatbotModule.name);
  
  constructor(
    private configService: ConfigService,
    private clientConfigService: ClientConfigService
  ) {}
  
  async onModuleInit() {
    this.logger.log('Chatbot Module initializing...');
    
    // Log RabbitMQ details
    const isLocal = process.env.NODE_ENV !== 'production';
    const queueName = this.configService.get('RABBITMQ_QUEUE_NAME') || 'chatbot_queue';
    const host = this.configService.get('RABBITMQ_HOST') || 'localhost';
    const port = this.configService.get('RABBITMQ_PORT') || '5672';
    const user = this.configService.get('RABBITMQ_USER');
    const password = this.configService.get('RABBITMQ_PASSWORD');
    
    const rabbitUrl = isLocal 
      ? `amqp://${user}:${password}@${host}:${port}`
      : `amqp://${user}:${password}@rabbitmq:5672`;
    
    this.logger.log('==========================================');
    this.logger.log(`[ChatbotModule] Environment: ${isLocal ? 'LOCAL' : 'DOCKER'}`);
    this.logger.log(`[ChatbotModule] RabbitMQ URL: ${rabbitUrl}`);
    this.logger.log(`[ChatbotModule] RabbitMQ Queue: ${queueName}`);
    this.logger.log(`[ChatbotModule] RabbitMQ Host: ${host}:${port}`);
    this.logger.log('==========================================');
    
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