import { Module, OnModuleInit, Logger } from '@nestjs/common'
import { ChatbotService } from './chatbot.service'
import { ChatbotController } from './chatbot.controller'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GeminiService } from './utils/gemini.service'
import { CHATBOT_CLIENT } from 'apps/api-gateway/src/constraints'
import { ClientProxyFactory, Transport } from '@nestjs/microservices'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { ClientConfigModule } from 'apps/configs/client-config.module'

// Define the client token
const CRACK_CLIENT = 'CRACK_CLIENT';
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // PrismaModule,
    ClientConfigModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService, 
    GeminiService, 
    {
      provide: CHATBOT_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.chatbotClientOptions
        return ClientProxyFactory.create(clientOptions)
      },
      inject: [ClientConfigService],
    },
    {
      provide: BUILDINGS_CLIENT,
        useFactory: (configService: ConfigService) => {
          const url = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue: 'buildings_queue',
              queueOptions: {
                durable: true,
              },
            },
          }
        },
        inject: [ConfigService],

    },
    {
      provide: CRACK_CLIENT,
      useFactory: (configService: ConfigService) => {
        const rabbitUrl = configService.get('RABBITMQ_URL')
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [rabbitUrl],
            queue: 'cracks_queue',
            queueOptions: {
              durable: true,
              prefetchCount: 1,
            },
          },
        })
      },
      inject: [ConfigService],
    },
  ],
  exports: [ChatbotService],
})
export class ChatbotModule implements OnModuleInit {
  private readonly logger = new Logger(ChatbotModule.name);

  constructor(
    private configService: ConfigService,
    private clientConfigService: ClientConfigService
  ) { }

  async onModuleInit() {
    this.logger.log('Chatbot Module initializing...')

    // Log RabbitMQ details
    const rabbitUrl = this.configService.get('RABBITMQ_URL')
    const queueName = this.configService.get('RABBITMQ_QUEUE_NAME') || 'chatbot_queue'

    this.logger.log('==========================================')
    this.logger.log(`[ChatbotModule] RabbitMQ URL: ${rabbitUrl}`)
    this.logger.log(`[ChatbotModule] RabbitMQ Queue: ${queueName}`)
    this.logger.log('==========================================')

    // Kiểm tra Gemini API key
    const geminiApiKey = this.configService.get('GEMINI_API_KEY')
    if (geminiApiKey) {
      this.logger.log('Gemini API Key is configured')
    } else {
      this.logger.warn('Gemini API Key is not configured. Chatbot will use fallback responses.')
    }

    this.logger.log('Chatbot Module initialized successfully')
  }
}