import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { ScheduleModule } from './Schedule.module'

async function bootstrap() {
  const app = await NestFactory.create(ScheduleModule)
  const configService = app.get(ConfigService)
  const rabbitUrl = configService.get('RABBITMQ_URL')

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue: 'schedules_queue',
      queueOptions: {
        durable: true,
      },
    },
  })

  await app.startAllMicroservices()
}
bootstrap()
