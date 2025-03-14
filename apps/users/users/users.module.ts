import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { PrismaModule } from '../prisma/prisma.module'
import { ClientsModule, Transport } from '@nestjs/microservices'

@Module({
  imports: [PrismaModule,
    ClientsModule.register([
      {
        name: 'BUILDING_CLIENT', // ✅ Đăng ký RabbitMQ Client
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@localhost:5672'], // ✅ Đảm bảo user/password đúng
          queue: 'building-maintenance', // 🔹 Đảm bảo trùng với queue trong Building
          queueOptions: { durable: true }
        }
      }
    ])
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
