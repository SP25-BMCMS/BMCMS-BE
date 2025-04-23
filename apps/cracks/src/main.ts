import { NestFactory } from '@nestjs/core';

import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CracksModule } from './cracks.module';

async function bootstrap() {
  const app = await NestFactory.create(CracksModule);
  const configService = app.get(ConfigService);

  const url = configService.get('RABBITMQ_URL');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue: 'cracks_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
}
bootstrap();
