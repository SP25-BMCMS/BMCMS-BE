import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientProxyFactory } from '@nestjs/microservices'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { CracksController } from './cracks.controller'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { CRACK_CLIENT } from '../constraints'

@Module({
  controllers: [CracksController],
  imports: [
    ClientConfigModule,
    ConfigModule
  ],
  providers: [
    {
      provide: CRACK_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.cracksClientOptions
        return ClientProxyFactory.create(clientOptions)
      },
      inject: [ClientConfigService],
    },
  ],
})
export class CracksModule { }
