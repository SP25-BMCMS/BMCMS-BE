import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientProxyFactory } from '@nestjs/microservices'
import { PassportModule } from '@nestjs/passport'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { BUILDING_CLIENT } from '../constraints'
import { BuildingsService } from './Buildings.service'
import { BuildingsController } from './buildings.controller'

@Module({
  imports: [
    ClientConfigModule,
    ConfigModule
  ],
  providers: [
    BuildingsService,
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
  controllers: [BuildingsController],
})
export class BuildingsModule { }