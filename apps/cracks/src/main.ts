import { NestFactory } from '@nestjs/core';

import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CracksModule } from './cracks.module';

async function bootstrap() {
  const app = await NestFactory.create(CracksModule);
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
      queue: 'cracks_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
}
bootstrap();
