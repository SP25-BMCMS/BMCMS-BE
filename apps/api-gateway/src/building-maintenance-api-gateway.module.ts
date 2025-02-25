import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BuildingMaintenanceApiGatewayController } from './building-maintenance-api-gateway.controller'
import { BuildingMaintenanceApiGatewayService } from './building-maintenance-api-gateway.service'
import { UsersModule } from './users/users.module'
import { BuildingsModule } from './buildings/buildings.module'
import {AreasModule } from './Area/Areas.module'
import { BuildingDetailModule } from './BuildingDetail/buildingDetail.module'
import { LocationDetailModule } from './LocationDetail/locationDetail.module'


@Module({
  imports: [UsersModule, ConfigModule.forRoot(),BuildingsModule,AreasModule,BuildingDetailModule,LocationDetailModule],
  controllers: [BuildingMaintenanceApiGatewayController],
  providers: [BuildingMaintenanceApiGatewayService],
})
export class BuildingMaintenanceApiGatewayModule { }
