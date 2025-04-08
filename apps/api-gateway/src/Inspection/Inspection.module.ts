import { Module } from '@nestjs/common';
import {
  ClientProxyFactory,
  ClientOptions,
  Transport,
  ClientsModule,
} from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { InspectionService } from './Inspection.service';
import { TASK_CLIENT, USERS_CLIENT, CRACK_CLIENT, BUILDING_CLIENT } from '../constraints';
import { InspectionController } from './Inspection.controller';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ClientConfigModule,
    ConfigModule,
    PassportModule,
    ClientsModule.registerAsync([
      {
        name: USERS_CLIENT,
        imports: [ClientConfigModule],
        useFactory: (clientConfigService: ClientConfigService) => {
          return clientConfigService.usersClientOptions;
        },
        inject: [ClientConfigService],
      },
    ]),
  ],
  providers: [
    InspectionService,
    {
      provide: TASK_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.TasksClientOptions; // Getting the client options
        return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
    {
      provide: CRACK_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.cracksClientOptions; // Getting the client options for cracks
        return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
    {
      provide: BUILDING_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.buildingsClientOptions; // Getting the client options for buildings
        return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
  ],
  controllers: [InspectionController],
})
export class InspectionModule { }
