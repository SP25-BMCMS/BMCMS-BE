import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientOptions, Transport } from '@nestjs/microservices'

@Injectable()
export class ClientConfigService {
  constructor(private config: ConfigService) { }

  private getRabbitMQConfig() {
    const url = this.config.get('RABBITMQ_URL')
    const queueName = this.config.get('RABBITMQ_QUEUE_NAME')

    return { url, queueName }
  }

  private getRabbitMQOptions(queue: string): ClientOptions {
    const { url } = this.getRabbitMQConfig()
    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: queue,
        queueOptions: {
          durable: true,
          arguments: {
            'x-max-priority': 10,
            'x-message-ttl': 3600000,
            'x-expires': 20800000,
          },
        },
        socketOptions: {
          heartbeatIntervalInSeconds: 30,
          reconnectTimeInSeconds: 5,
        },
        noAck: false,
        persistent: true,
        prefetchCount: 1,
        isGlobalPrefetchCount: true,
        maxConnectionAttempts: 5,
      },
    }
  }

  getUsersClientPort(): number {
    return this.config.get<number>('USERS_CLIENT_PORT')
  }

  getBuildingsClientPort(): number {
    return this.config.get<number>('BUILDINGS_CLIENT_PORT')
  }

  get usersClientOptions(): ClientOptions {
    const isLocal = process.env.NODE_ENV !== 'production'
    return {
      transport: Transport.GRPC,
      options: {
        package: 'users',
        protoPath: 'libs/contracts/src/users/users.proto',
        url: isLocal ? 'localhost:3001' : `users_service:3001`,
      },
    }
  }

  get cracksClientOptions(): ClientOptions {
    return this.getRabbitMQOptions('cracks_queue')
  }

  get buildingsClientOptions(): ClientOptions {
    return this.getRabbitMQOptions('buildings_queue')
  }

  get TasksClientOptions(): ClientOptions {
    return this.getRabbitMQOptions('tasks_queue')
  }

  get SchedulesClientOptions(): ClientOptions {
    return this.getRabbitMQOptions('schedules_queue')
  }

  get NotificationsClientOptions(): ClientOptions {
    return this.getRabbitMQOptions('notifications_queue')
  }

  get chatbotClientOptions(): ClientOptions {
    const { url } = this.getRabbitMQConfig()
    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: 'chatbot_queue',
        queueOptions: {
          durable: true,
          arguments: {
            'x-max-priority': 10,
            'x-message-ttl': 3600000,
            'x-expires': 86400000,
          },
        },
        socketOptions: {
          heartbeatIntervalInSeconds: 30,
          reconnectTimeInSeconds: 5,
        },
        noAck: true,
        persistent: false,
        prefetchCount: 1,
        isGlobalPrefetchCount: true,
        maxConnectionAttempts: 5,
      },
    }
  }
}
