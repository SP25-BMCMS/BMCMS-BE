import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BuildingMaintenanceApiGatewayController } from './building-maintenance-api-gateway.controller'
import { BuildingMaintenanceApiGatewayService } from './building-maintenance-api-gateway.service'
import { UsersModule } from './users/users.module'
import { BuildingsModule } from './buildings/buildings.module'

@Module({
  imports: [UsersModule, ConfigModule.forRoot(),BuildingsModule],
  controllers: [BuildingMaintenanceApiGatewayController],
  providers: [BuildingMaintenanceApiGatewayService],
})
export class BuildingMaintenanceApiGatewayModule { }
