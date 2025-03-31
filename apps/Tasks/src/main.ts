import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { TaskModule } from './Task.module';

async function bootstrap() {
  const app = await NestFactory.create(TaskModule);
  const configService = app.get(ConfigService);
  const user = configService.get('RABBITMQ_USER');
  const password = configService.get('RABBITMQ_PASSWORD');
  const host = configService.get('RABBITMQ_HOST');
  const queueName = configService.get('RABBITMQ_QUEUE_NAME');
  const isLocal = process.env.NODE_ENV !== 'production';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: isLocal
        ? [`amqp://${user}:${password}@${host}`]
        : [`amqp://${user}:${password}@rabbitmq:5672`],
      queue: 'tasks_queue',
      queueOptions: {
        durable: true,
      },
    },
  });
  // await app.listen(microservicePort); // Đảm bảo ứng dụng NestJS lắng nghe đúng cổng HTTP

  await app.startAllMicroservices();
}
bootstrap();
