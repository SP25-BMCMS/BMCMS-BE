import { NestFactory } from '@nestjs/core';
import { BuildingsModule } from './buildings.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
 const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  BuildingsModule,
    {
      transport: Transport.RMQ,
      options: {
          urls: ['amqp://localhost:5672'], // Địa chỉ RabbitMQ
          queue: 'buildings_queue', // Tên hàng đợi
          queueOptions: {
            durable: false, // Cấu hình để hàng đợi không bền vững (tùy theo yêu cầu)
          },    
          },
    },
  )
  await app.listen()
}
bootstrap();
