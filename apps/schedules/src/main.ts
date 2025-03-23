import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from './Schedule.module';

async function bootstrap() {

    const app = await NestFactory.create(ScheduleModule);
    const configService = app.get(ConfigService);
   // const microservicePort  = configService.get<number>('BUILDINGS_SERVICE_PORT') || 3004;  // Đổi cổng Microservice Buildings
  
    const user = configService.get('RABBITMQ_USER');
    const password = configService.get('RABBITMQ_PASSWORD');
    const host = configService.get('RABBITMQ_HOST');
    const queueName = configService.get('RABBITMQ_QUEUE_NAME');
    const isLocal = process.env.NODE_ENV !== 'production'
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: isLocal ? [`amqp://${user}:${password}@${host}`] : [`amqp://${user}:${password}@rabbitmq:5672`],
        queue: "schedules_queue",
        queueOptions: {
          durable: true,
        }
      }
    });
   // await app.listen(microservicePort); // Đảm bảo ứng dụng NestJS lắng nghe đúng cổng HTTP
  
    await app.startAllMicroservices();
}
bootstrap();
