import { Module } from '@nestjs/common'
import { BuildingMaintenanceApiGatewayController } from './building-maintenance-api-gateway.controller'
import { BuildingMaintenanceApiGatewayService } from './building-maintenance-api-gateway.service'
import { UsersModule } from './users/users.module'
import { APP_FILTER } from '@nestjs/core'
import { GlobalExceptionFilter } from './exception-filters/global-exception.filter'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [UsersModule, ConfigModule.forRoot()],
  controllers: [BuildingMaintenanceApiGatewayController],
  providers: [BuildingMaintenanceApiGatewayService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter
    }
  ],
})
export class BuildingMaintenanceApiGatewayModule { }
