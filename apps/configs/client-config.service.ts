import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { ClientOptions, Transport } from "@nestjs/microservices"

@Injectable()
export class ClientConfigService {
  constructor(private config: ConfigService) { }
  private getRabbitMQConfig() {
    const user = this.config.get('RABBITMQ_USER') // Get RabbitMQ user from config
    const password = this.config.get('RABBITMQ_PASSWORD') // Get RabbitMQ password from config
    const host = this.config.get('RABBITMQ_HOST') // Get RabbitMQ host from config
    const queueName = this.config.get('RABBITMQ_QUEUE_NAME') // Get queue name from config

    return { user, password, host, queueName }
  }

  getUsersClientPort(): number {

    return this.config.get<number>('USERS_CLIENT_PORT')
  }

  getBuildingsClientPort(): number {

    return this.config.get<number>('BUILDINGS_CLIENT_PORT')
  }

  get usersClientOptions(): ClientOptions {
    return {
      transport: Transport.GRPC,
      options: {
        package: 'users',
        protoPath: "libs/contracts/src/users/users.proto",
        url: `users_service:3001`
      }
    }
  }
  get cracksClientOptions(): ClientOptions {
    const { user, password, host, queueName } = this.getRabbitMQConfig() // Get RabbitMQ config
    return {
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${user}:${password}@${host}`,
          `amqp://${user}:${password}@rabbitmq:5672`],
        queue: 'cracks_queue',
      },
    }
  }

  get buildingsClientOptions(): ClientOptions {
    const { user, password, host, queueName } = this.getRabbitMQConfig() // Get RabbitMQ config
    return {
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${user}:${password}@${host}`, `amqp://${user}:${password}@rabbitmq:5672`],
        queue: "buildings_queue",
        queueOptions: {
          durable: true,
        },
      },
    }
  };


  get TasksClientOptions(): ClientOptions {
    const { user, password, host, queueName } = this.getRabbitMQConfig() // Get RabbitMQ config

    return {
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${user}:${password}@${host}`, `amqp://${user}:${password}@rabbitmq:5672`],
        queue: "tasks_queue",
        queueOptions: {
          durable: true,
        },
      },
    }
  };

  get SchedulesClientOptions(): ClientOptions {
    const { user, password, host, queueName } = this.getRabbitMQConfig() // Get RabbitMQ config
    return {
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${user}:${password}@${host}`, `amqp://${user}:${password}@rabbitmq:5672`],
        queue: "schedules_queue",
        queueOptions: {
          durable: true,
        },
      },
    }
  };
}
