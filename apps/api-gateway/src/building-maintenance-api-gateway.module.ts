import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { UsersModule } from './users/users.module'
import { BuildingsModule } from './buildings/buildings.module'
import {AreasModule } from './Area/Areas.module'
import { BuildingDetailModule } from './BuildingDetail/buildingDetail.module'
import { LocationDetailModule } from './LocationDetail/locationDetail.module'
import { CracksModule } from './cracks/cracks.module';
import { TasksModule } from './Task/Tasks.module'



@Module({
  imports: [UsersModule, ConfigModule.forRoot(),BuildingsModule,AreasModule,BuildingDetailModule,LocationDetailModule,CracksModule,TasksModule],
 // controllers: [BuildingMaintenanceApiGatewayController],
 // providers: [BuildingMaintenanceApiGatewayService],
})
export class BuildingMaintenanceApiGatewayModule { }
