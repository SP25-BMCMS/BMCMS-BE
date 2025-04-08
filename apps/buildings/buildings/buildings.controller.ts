import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
import { Controller } from '@nestjs/common'
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices'
import { BUILDINGS_PATTERN } from 'libs/contracts/src/buildings/buildings.patterns'
import { BuildingsService } from './buildings.service'
@Controller('buildings')
export class BuildingsController {
  constructor(private buildingsService: BuildingsService) { }

  @MessagePattern(BUILDINGS_PATTERN.CREATE)
  async createBuilding(@Payload() data: any) {
    return await this.buildingsService.createBuilding(data);
  }

  // @MessagePattern(BUILDINGS_PATTERN.GET)
  // async getAllBuildings(@Payload() data: any) {
  //   console.log('Getting all buildings...');
  //   return await this.buildingsService.readBuilding();
  // }
  @MessagePattern(BUILDINGS_PATTERN.GET)
  async getAllBuildings(@Payload() paginationParams: PaginationParams) {
    try {
      return await this.buildingsService.readBuilding(paginationParams);
    } catch (error) {
      console.error('Error in getAllBuildings:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving buildings!',
      })
    }
  }

  @MessagePattern(BUILDINGS_PATTERN.UPDATE)
  updateBuilding(@Payload() data: any) {
    return this.buildingsService.updateBuilding(data);
  }

  @MessagePattern(BUILDINGS_PATTERN.DELETE)
  deleteBuilding(@Payload() payload: { buildingId: string }) {
    return this.buildingsService.deleteBuilding(payload.buildingId);
  }
  @MessagePattern(BUILDINGS_PATTERN.GET_BY_ID)
  async getBuildingById(@Payload() payload: { buildingId: string }) {
    console.log(
      '🚀 ~ BuildingsController ~ getBuildingById ~ payload:',
      payload.buildingId,
    )

    return this.buildingsService.getBuildingById(payload.buildingId);
  }

  // @MessagePattern('get_apartment_by_id')
  // async getApartmentById(@Payload() payload: { apartmentId: string }) {
  //   return this.buildingsService.getApartmentById(payload.apartmentId);
  // }

  @MessagePattern('check_area_exists') // 🟢 Đảm bảo có handler này
  async checkAreaExists(@Payload() data: { areaName: string }) {
    const area = await this.buildingsService.checkAreaExists(data.areaName);
    return {
      exists: !!area,
      message: area ? 'Area exists' : 'Area does not exist',
    }
  }

  @MessagePattern(BUILDINGS_PATTERN.CHECK_EXISTS)
  async checkBuildingExists(@Payload() data: { buildingId: string }) {
    try {
      console.log('Received request to check building existence:', data)

      if (!data.buildingId) {
        return {
          statusCode: 400,
          message: 'Building ID is required',
          exists: false,
        }
      }

      const building = await this.buildingsService.checkBuildingExists(
        data.buildingId,
      )

      if (!building) {
        return {
          statusCode: 404,
          message: `Building with ID ${data.buildingId} not found`,
          exists: false,
        }
      }

      return {
        statusCode: 200,
        message: 'Building exists',
        exists: true,
        data: building,
      }
    } catch (error) {
      console.error('Error in checkBuildingExists:', error)
      return {
        statusCode: 500,
        message: 'Error checking building existence',
        exists: false,
      }
    }
  }

  @MessagePattern(BUILDINGS_PATTERN.GET_RESIDENTS_BY_BUILDING_ID)
  async getAllResidentsByBuildingId(@Payload() buildingId: string) {
    return this.buildingsService.getAllResidentsByBuildingId(buildingId);
  }
}
