import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { NotificationsModule } from './notifications.module'
import Redis from 'ioredis'

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule)
  const configService = app.get(ConfigService)

  const redisUrl = configService.get<string>('REDIS_URL')
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set')
  }

  // Create Redis instance
  const redis = new Redis(redisUrl, {
    tls: {
      rejectUnauthorized: false
    },
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    maxRetriesPerRequest: 3
  })

  // Test connection
  try {
    await redis.ping()
    console.log('✅ Redis connection successful')
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    process.exit(1)
  }

  const redisOptions = {
    host: redis.options.host,
    port: redis.options.port,
    username: redis.options.username,
    password: redis.options.password,
    retryAttempts: 5,
    retryDelay: 5000,
    tls: {
      rejectUnauthorized: false
    }
  }

  try {
    // Kết nối Redis microservice
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.REDIS,
      options: redisOptions,
    })

    // Kết nối thêm RabbitMQ microservice
    const rabbitUrl = configService.get<string>('RABBITMQ_URL')
    if (rabbitUrl) {
      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
          urls: [rabbitUrl],
          queue: 'notifications_queue',
          queueOptions: {
            durable: true,
            prefetchCount: 1,
          },
        },
      })
      console.log('✅ RabbitMQ configuration added')
    }

    await app.startAllMicroservices()
    console.log(`✅ Microservices started successfully!`)
  } catch (error) {
    console.error('❌ Error starting microservice:', error)
  }
}

bootstrap()
