import { Module } from '@nestjs/common';
import { ClientProxyFactory, ClientOptions, Transport } from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-confit.service';
import { BuildingsService } from './Buildings.service';
import { BUILDING_CLIENT } from '../constraints';
import { BuildingsController } from './buildings.controller';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ApartmentService } from '../users/apartment/apartment.service';
import { USERS_CLIENT } from '../constraints';

@Module({
  imports: [    
    ClientConfigModule,
    ConfigModule
  ],
  providers: [
    BuildingsService,
    ApartmentService,
    PassportModule,
    {
      provide: BUILDING_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.buildingsClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ClientConfigService],
    },
    {
      provide: USERS_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.usersClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ClientConfigService],
    },
  ],
  controllers: [BuildingsController],
  exports: [BuildingsService]
})
export class BuildingsModule { }