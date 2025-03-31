import { Module } from '@nestjs/common';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { TaskAssignmentService } from './TaskAssigment.service';
import { TASK_CLIENT } from '../constraints';
import { TaskAssignmentController } from './TaskAssigment.controller';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [ClientConfigModule, ConfigModule],
  providers: [
    TaskAssignmentService,
    PassportModule,
    {
      provide: TASK_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.TasksClientOptions; // Getting the client options
        return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
  ],
  controllers: [TaskAssignmentController],
})
export class TaskAssigmentModule {}
