import { Module } from '@nestjs/common';
import { TaskAssignmentsService } from './TaskAssignments.service';
import { TaskAssignmentsController } from './TaskAssignments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TASK_CLIENT } from 'apps/api-gateway/src/constraints';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { ClientConfigModule } from 'apps/configs/client-config.module';

@Module({
  imports: [
    PrismaModule,
    ClientConfigModule,
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
  providers: [
    TaskAssignmentsService,
    {
      provide: 'CRACK_CLIENT',
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.cracksClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ClientConfigService],
    },
  ],
  controllers: [TaskAssignmentsController],
  exports: [TaskAssignmentsService]
})
export class TaskAssignmentsModule { }