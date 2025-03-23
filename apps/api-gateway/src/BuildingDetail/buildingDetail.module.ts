
import { Module } from '@nestjs/common'
import { ClientProxyFactory, ClientOptions, Transport } from '@nestjs/microservices'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { BuildingDetailService } from './buildingDetail.service'
import { BUILDING_CLIENT } from '../constraints'
import { BuildingDetailController } from './buildingDetail.controller'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'

@Module({
  imports: [ClientConfigModule,
    ConfigModule
  ],
  providers: [
    BuildingDetailService,
    PassportModule,

    {
      provide: BUILDING_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.buildingsClientOptions // Getting the client options
        return ClientProxyFactory.create(clientOptions) // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
  ],
  controllers: [BuildingDetailController],
})
export class BuildingDetailModule { }
