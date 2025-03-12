
import { Module } from '@nestjs/common';
import { ClientProxyFactory, ClientOptions, Transport } from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-confit.service';
import {   SchedulesService } from './Schedules.service';
import { SCHEDULE_CLIENT } from '../constraints';
import { SchedulesController as SchedulesController } from './Schedules.controller';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [    ClientConfigModule,
    ConfigModule
  ],
  providers: [
    SchedulesService,
        PassportModule,
    
    {
      provide: SCHEDULE_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.SchedulesClientOptions; // Getting the client options
        return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
  ],
  controllers: [SchedulesController],
})
export class SchedulesModule { }