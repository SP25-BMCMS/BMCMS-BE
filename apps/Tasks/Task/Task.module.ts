import { TaskService } from './Task.service';
import { TasksController } from './Task.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { TASK_CLIENT } from 'apps/api-gateway/src/constraints';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: TASK_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@rabbitmq:5672'],
          queue: 'tasks_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [TaskService],
  controllers: [TasksController],
})
export class TasksModule { }
