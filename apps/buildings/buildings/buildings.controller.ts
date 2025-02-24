import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {BuildingsService} from './buildings.service';
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns';
import { UUID } from 'crypto';
@Controller('buildings')
export class BuildingsController {

  constructor(private BuildingsService: BuildingsService) { }

    @MessagePattern(BUILDINGS_PATTERN.CREATE)
    async createBuilding(@Payload() data: any) {
   return await this.BuildingsService.createBuilding(data);
    }
  
    @MessagePattern(BUILDINGS_PATTERN.GET)
    async getAllBuildings(@Payload() data: any) {
      console.log('Getting all buildings...');
  return await this.BuildingsService.readBuilding();
}

  
    @MessagePattern(BUILDINGS_PATTERN.UPDATE)
    updateBuilding(@Payload() data: any) {
      return this.BuildingsService.updateBuilding(data);
    }
  
    @MessagePattern(BUILDINGS_PATTERN.DELELTE)
    deleteBuilding(@Payload() data: any) {
      return this.BuildingsService.deleteBuilding(data);
    }
    @MessagePattern(BUILDINGS_PATTERN.GET_BY_ID)
    async getBuildingById(@Payload() payload: { buildingId: string }) {
      console.log("🚀 ~ BuildingsCoádasdsdassdntroller ~ getBuildingById ~ buildingId:", payload.buildingId)
      
      return this.BuildingsService.getBuildingById(payload.buildingId);
    }
}
