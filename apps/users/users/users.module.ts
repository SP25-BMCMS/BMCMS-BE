import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { PrismaModule } from '../prisma/prisma.module'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { UsersController } from './users.controller'

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'

@Module({
  imports: [PrismaModule,
    ClientsModule.register([
      {
        name: 'BUILDING_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@localhost:5672'],
          queue: 'Building',
          queueOptions: { durable: true }
        }
      },
      {
        name: BUILDINGS_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@localhost:5672'],
          queue: 'Building',
          queueOptions: { durable: true }
        }
      }
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
