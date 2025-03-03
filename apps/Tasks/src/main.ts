import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { TaskModule } from './Task.module';

async function bootstrap() {
  // console.log(`Applicatasdadssdon is running on: http://localhost:`);
  // console.log(`Applicatasdadssdádasdasdson is running on: http://localhost:`);

  //  const app = await NestFactory.create(TaskModule);
  //   const configService = app.get(ConfigService);

  //   const user = configService.get('RABBITMQ_USER');
  //   const password = configService.get('RABBITMQ_PASSWORD');
  //   const host = configService.get('RABBITMQ_HOST');
  //   const queueName = configService.get('RABBITMQ_QUEUE_NAME');
  
  //   app.connectMicroservice<MicroserviceOptions>({
  //     transport: Transport.RMQ,
  //     options: {
  //       urls: [`amqp://${user}:${password}@${host}`],
  //       queue: queueName,
  //       queueOptions: {
  //         durable: true,
  //       }
  //     }
  //   });
  //   const port = configService.get('HTTP_PORT') || 3000;
  //   console.log(`Applicatasdadssdon is running on: http://localhost:${port}`);

  //   await app.startAllMicroservices();
    
  //   await app.listen(port, () => {
  //     console.log(`Application is running on: http://localhost:${port}`);
  //   });

    const app = await NestFactory.create(TaskModule);
    const configService = app.get(ConfigService);
    const microservicePort  = configService.get<number>('BUILDINGS_SERVICE_PORT') || 3002;  // Đổi cổng Microservice Buildings
    console.log("🚀 ~ bootstrap ~ BUILDINGS_SERVICE_PORT:", microservicePort)
  
    const user = configService.get('RABBITMQ_USER');
    const password = configService.get('RABBITMQ_PASSWORD');
    const host = configService.get('RABBITMQ_HOST');
    const queueName = configService.get('RABBITMQ_QUEUE_NAME');
  
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${user}:${password}@${host}`],
        queue: queueName,
        queueOptions: {
          durable: true,
        }
      }
    });
    await app.listen(microservicePort); // Đảm bảo ứng dụng NestJS lắng nghe đúng cổng HTTP
  
    await app.startAllMicroservices();
}
bootstrap();
