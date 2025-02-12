import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BuildingMaintenanceApiGatewayController } from './building-maintenance-api-gateway.controller'
import { BuildingMaintenanceApiGatewayService } from './building-maintenance-api-gateway.service'
import { UsersModule } from './users/users.module'

@Module({
  imports: [UsersModule, ConfigModule.forRoot()],
  controllers: [BuildingMaintenanceApiGatewayController],
  providers: [BuildingMaintenanceApiGatewayService],
})
export class BuildingMaintenanceApiGatewayModule { }
