import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ChatbotModule } from './chatbot.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ChatbotMain');
  logger.log('Starting Chatbot microservice...');
  
  const app = await NestFactory.create(ChatbotModule);
  const configService = app.get(ConfigService);

  const user = configService.get('RABBITMQ_USER') || 'guest';
  const password = configService.get('RABBITMQ_PASSWORD') || 'guest';
  const host = configService.get('RABBITMQ_HOST') || 'localhost';
  const queueName = configService.get('chatbot_queue') || 'chatbot_queue';
  const isLocal = process.env.NODE_ENV !== 'production';

  logger.log(`Connecting to RabbitMQ using queue: ${queueName}`);
  logger.log(`RabbitMQ credentials: ${user}@${host}`);
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: isLocal
        ? [`amqp://${user}:${password}@${host}`]
        : [`amqp://${user}:${password}@rabbitmq:5672`],
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
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  await app.startAllMicroservices();
  logger.log(`Chatbot microservice is running and connected to RabbitMQ`);  
}
bootstrap();
