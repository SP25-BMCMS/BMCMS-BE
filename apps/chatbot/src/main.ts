import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ChatbotModule } from './chatbot.module';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(ChatbotModule);
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')],
      queue: 'chatbot_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3004);

  // Ensure Prisma disconnects on shutdown
  const shutdown = async () => {
    await prismaService.onModuleDestroy();
    await app.close();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
bootstrap(); 