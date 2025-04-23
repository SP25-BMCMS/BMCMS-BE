import { NestFactory } from '@nestjs/core'
import { BuildingModule } from './building.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(BuildingModule)
  const configService = app.get(ConfigService)
  const rabbitUrl = configService.get('RABBITMQ_URL')

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue: 'buildings_queue',
      queueOptions: {
        durable: true,
        prefetchCount: 1,
      },
    },
  })

  await app.startAllMicroservices()
  await app.listen(3002)
  console.log('Buildings service is running on port 3002')
}
bootstrap()
