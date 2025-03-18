import { NestFactory } from '@nestjs/core';
import { BuildingModule } from './building.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(BuildingModule);
  const configService = app.get(ConfigService);
  const microservicePort  = configService.get<number>('BUILDINGS_SERVICE_PORT') || 3002;  // Đổi cổng Microservice Buildings
  console.log("🚀 ~ bootstrap ~ microservicePort:", microservicePort)
  console.log("🚀 ~ bootstrap ~ BUILDINGS_SERVICE_PORT:", microservicePort)

  const user = configService.get('RABBITMQ_USER');
  const password = configService.get('RABBITMQ_PASSWORD');
  const host = configService.get('RABBITMQ_HOST');
  const queueName = configService.get('RABBITMQ_QUEUE_NAME');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${user}:${password}@${host}`],
      queue: "Building",
      queueOptions: {
        durable: true,
      }
    }
  });
  await app.listen(microservicePort); // Đảm bảo ứng dụng NestJS lắng nghe đúng cổng HTTP

  await app.startAllMicroservices();

}
bootstrap();
