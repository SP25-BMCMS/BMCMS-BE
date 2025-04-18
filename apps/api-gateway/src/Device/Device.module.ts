import { Module } from '@nestjs/common';
import { DeviceService } from './Device.service';
import { DeviceController } from './Device.controller';
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { BUILDING_CLIENT } from '../constraints';

@Module({
    imports: [ClientConfigModule, ConfigModule],
    controllers: [DeviceController],
    providers: [
      DeviceService,
      {
        provide: BUILDING_CLIENT,
        useFactory: (configService: ClientConfigService) => {
          const clientOptions = configService.buildingsClientOptions  ;
          return ClientProxyFactory.create(clientOptions);
        },
        inject: [ClientConfigService],
      },
    ],
  })
export class DeviceModule {} 