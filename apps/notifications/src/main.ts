import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { NotificationsModule } from './notifications.module'

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule)
  const configService = app.get(ConfigService)

  // Lấy cấu hình Redis từ environment variables với giá trị mặc định
  const redisHost = configService.get<string>('REDIS_HOST', 'redis')
  const redisPort = configService.get<number>('REDIS_PORT', 6379)
  const redisPassword = configService.get<string>('REDIS_PASSWORD', '')

  const redisOptions = {
    host: redisHost,
    port: redisPort,
    password: redisPassword || undefined,
    retryAttempts: 5,
    retryDelay: 5000,
  }



  try {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.REDIS,
      options: redisOptions,
    })
    await app.startAllMicroservices()
    console.log(`✅ Microservices started successfully!`)
  } catch (error) {
    console.error('❌ Error starting microservice:', error)
  }
}

bootstrap()
