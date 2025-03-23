
import { Module } from '@nestjs/common'
import { ClientProxyFactory, ClientOptions, Transport } from '@nestjs/microservices'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { WorklogService } from './WorkLog.service'
import { TASK_CLIENT } from '../constraints'
import { WorkLogController } from './WorkLog.controller'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'

@Module({
  imports: [ClientConfigModule,
    ConfigModule
  ],
  providers: [
    WorklogService,
    PassportModule,

    {
      provide: TASK_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.TasksClientOptions
        return ClientProxyFactory.create(clientOptions)
      },
      inject: [ClientConfigService],
    },
  ],
  controllers: [WorkLogController],
})
export class worklogModule { }