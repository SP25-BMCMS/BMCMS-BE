import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { TaskModule } from './Task.module'

async function bootstrap() {
  const app = await NestFactory.create(TaskModule)
  const configService = app.get(ConfigService)
  const url = configService.get('RABBITMQ_URL')
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue: 'tasks_queue',
      queueOptions: {
        durable: true,
      },
    },
  })
  // await app.listen(microservicePort); // Đảm bảo ứng dụng NestJS lắng nghe đúng cổng HTTP

  await app.startAllMicroservices()
}
bootstrap()
