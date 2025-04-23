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
    const { url, queueName } = this.getRabbitMQConfig()
    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: 'cracks_queue',
        queueOptions: {
          durable: true,
        },
      },
    }
  }

  get buildingsClientOptions(): ClientOptions {
    const { url, queueName } = this.getRabbitMQConfig()
    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: 'buildings_queue',
        queueOptions: {
          durable: true,
        },
      },
    }
  }

  get TasksClientOptions(): ClientOptions {
    const { url, queueName } = this.getRabbitMQConfig()
    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: 'tasks_queue',
        queueOptions: {
          durable: true,
        },
      },
    }
  }

  get SchedulesClientOptions(): ClientOptions {
    const { url, queueName } = this.getRabbitMQConfig()
    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: 'schedules_queue',
        queueOptions: {
          durable: true,
        },
      },
    }
  }

  get NotificationsClientOptions(): ClientOptions {
    const { url, queueName } = this.getRabbitMQConfig()
    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: 'notifications_queue',
        queueOptions: {
          durable: true,
        },
      },
    }
  }

  get chatbotClientOptions(): ClientOptions {
    const { url, queueName } = this.getRabbitMQConfig()
    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: 'chatbot_queue',
        queueOptions: {
          durable: true,
        },
        prefetchCount: 1,
        socketOptions: {
          heartbeatIntervalInSeconds: 60,
          reconnectTimeInSeconds: 10,
        },
        noAck: true,
        persistent: false
      },
    }
  }
}
