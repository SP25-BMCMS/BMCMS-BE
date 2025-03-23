import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { BuildingsService } from './buildings.service';
import { UUID } from 'crypto';
import { BUILDINGS_PATTERN } from 'libs/contracts/src/buildings/buildings.patterns';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
@Controller('buildings')
export class BuildingsController {

  constructor(private BuildingsService: BuildingsService) { }

  @MessagePattern(BUILDINGS_PATTERN.CREATE)
  async createBuilding(@Payload() data: any) {
    return await this.BuildingsService.createBuilding(data);
  }

  // @MessagePattern(BUILDINGS_PATTERN.GET)
  // async getAllBuildings(@Payload() data: any) {
  //   console.log('Getting all buildings...');
  //   return await this.BuildingsService.readBuilding();
  // }
  @MessagePattern(BUILDINGS_PATTERN.GET)
  async getAllBuildings(@Payload() paginationParams: PaginationParams) {
    try {
      return await this.BuildingsService.readBuilding(paginationParams);
    } catch (error) {
      console.error("Error in getAllBuildings:", error);
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving buildings!'
      });
    }
  }


  @MessagePattern(BUILDINGS_PATTERN.UPDATE)
  updateBuilding(@Payload() data: any) {
    return this.BuildingsService.updateBuilding(data);
  }

  @MessagePattern(BUILDINGS_PATTERN.DELELTE)
  deleteBuilding(@Payload() payload: { buildingId: string }) {
    return this.BuildingsService.deleteBuilding(payload.buildingId);
  }
  @MessagePattern(BUILDINGS_PATTERN.GET_BY_ID)
  async getBuildingById(@Payload() payload: { buildingId: string }) {
    console.log("🚀 ~ BuildingsController ~ getBuildingById ~ payload:", payload.buildingId)

    return this.BuildingsService.getBuildingById(payload.buildingId);
  }

  // @MessagePattern('get_apartment_by_id')
  // async getApartmentById(@Payload() payload: { apartmentId: string }) {
  //   return this.BuildingsService.getApartmentById(payload.apartmentId);
  // }

  @MessagePattern('check_area_exists') // 🟢 Đảm bảo có handler này
  async checkAreaExists(@Payload() data: { areaName: string }) {
    const area = await this.BuildingsService.checkAreaExists(data.areaName);
    return { exists: !!area, message: area ? 'Area exists' : 'Area does not exist' };
  }

  @MessagePattern(BUILDINGS_PATTERN.CHECK_EXISTS)
  async checkBuildingExists(@Payload() data: { buildingId: string }) {
    console.log('Received request to check building existence:', data);
    return this.BuildingsService.checkBuildingExists(data.buildingId);
  }
}
