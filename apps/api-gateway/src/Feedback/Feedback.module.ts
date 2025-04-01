import { Module } from '@nestjs/common';
import {
  ClientProxyFactory,
  ClientOptions,
  Transport,
} from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { FeedbackService } from './Feedback.service';
import { TASK_CLIENT } from '../constraints';
import { FeedbackController } from './Feedback.controller';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [ClientConfigModule, ConfigModule],
  providers: [
    FeedbackService,
    PassportModule,
    {
      provide: TASK_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.TasksClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ClientConfigService],
    },
  ],
  controllers: [FeedbackController],
})
export class FeedbackModule {} 