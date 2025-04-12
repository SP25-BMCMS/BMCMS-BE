import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { ChatbotModule } from './chatbot.module'
import { Logger } from '@nestjs/common'

async function bootstrap() {
  const logger = new Logger('ChatbotMain')
  logger.log('Starting Chatbot microservice...')

  const app = await NestFactory.create(ChatbotModule)
  const configService = app.get(ConfigService)

  const url = configService.get('RABBITMQ_URL')
  const queueName = configService.get('RABBITMQ_QUEUE_NAME') || 'chatbot_queue'

  logger.log(`Connecting to RabbitMQ using queue: ${queueName}`)
  logger.log(`RabbitMQ URL: ${url}`)

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue: 'chatbot_queue',
      queueOptions: {
        durable: true,
      },
      prefetchCount: 1,
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 10,
      },
      noAck: true,
      persistent: false
    },
  })

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error)
  })

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })

  await app.startAllMicroservices()
  logger.log(`Chatbot microservice is running and connected to RabbitMQ`)
}
bootstrap()
