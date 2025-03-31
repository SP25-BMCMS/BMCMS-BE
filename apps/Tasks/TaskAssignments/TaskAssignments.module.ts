import { Module } from '@nestjs/common';
import { TaskAssignmentsService as TaskAssignmentsService } from './TaskAssignments.service';
import { TaskAssignmentsController } from './TaskAssignments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '@nestjs/microservices';
import { TASK_CLIENT } from 'apps/api-gateway/src/constraints';
import { Transport } from '@nestjs/microservices';

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
  providers: [TaskAssignmentsService],
  controllers: [TaskAssignmentsController],
})
export class TaskAssignmentsModule { }
