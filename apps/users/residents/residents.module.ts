import { Module } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'BUILDING_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@localhost:5672'],
          queue: 'Building',
          queueOptions: { durable: true }
        }
      }
    ])
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService],
})
export class ResidentsModule { }
