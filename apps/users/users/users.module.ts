import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { PrismaModule } from '../prisma/prisma.module'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { UsersController } from './users.controller'
import { ConfigService } from '@nestjs/config'

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'

@Module({
  imports: [PrismaModule,
    ClientsModule.registerAsync([
      {
        name: BUILDINGS_CLIENT,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: ['amqp://admin:admin@rabbitmq:5672'],
            queue: 'buildings_queue',
            queueOptions: {
              durable: true,
              prefetchCount: 1
            }
          }
        }),
        inject: [ConfigService]
      }
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
