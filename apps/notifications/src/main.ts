import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { NotificationsModule } from './notifications.module'

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule)
  const configService = app.get(ConfigService)

  // Lấy cấu hình Redis từ environment variables
  const redisHost = configService.get<string>('REDIS_HOST')
  const redisPort = configService.get<number>('REDIS_PORT')
  const redisPassword = configService.get<string>('REDIS_PASSWORD')
  const isLocal = process.env.NODE_ENV !== 'production'

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      // Sử dụng host khác nhau cho môi trường local và production
      host: isLocal ? redisHost : 'redis',
      port: redisPort,
      password: redisPassword,
      // Cấu hình thêm nếu dùng TLS
      ...(isLocal ? {} : {
        tls: {
          rejectUnauthorized: false
        }
      }),
      // Retry strategy
      retryAttempts: 5,
      retryDelay: 3000,
    },
  })

  await app.startAllMicroservices()
  console.log(`✅ Notifications microservice is running on Redis: ${redisHost}:${redisPort}`)
  console.log(`Notifications microservice is running`)
}

bootstrap()
