import { Module } from '@nestjs/common';
import { MaintenancehistoryService } from './maintenancehistory.service';
import { MaintenancehistoryController } from './maintenancehistory.controller';
import { ClientProxyFactory, ClientsModule } from '@nestjs/microservices';
import { BUILDING_CLIENT } from '../constraints';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ClientConfigModule,
    ConfigModule,
  ],
  controllers: [MaintenancehistoryController],
  providers: [MaintenancehistoryService,
    {
      provide: BUILDING_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.buildingsClientOptions; // Getting the client options
        return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService],
    },
  ],
})
export class MaintenancehistoryModule { }
