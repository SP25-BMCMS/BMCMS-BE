import { Module } from '@nestjs/common';
import { MaintenanceCycleController } from './MaintenanceCycle.controller';
import { MaintenanceCycleService } from './MaintenanceCycle.service';
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { SCHEDULE_CLIENT } from '../constraints';

@Module({
  imports: [ClientConfigModule],
  controllers: [MaintenanceCycleController],
  providers: [
    MaintenanceCycleService,
    {
      provide: SCHEDULE_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.SchedulesClientOptions // Getting the client options
        return ClientProxyFactory.create(clientOptions) // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
  ],
})
export class MaintenanceCycleModule {} 