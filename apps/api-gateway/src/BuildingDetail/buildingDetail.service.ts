import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
 import { BUILDING_CLIENT } from '../constraints'
import { BUILDINGDETAIL_PATTERN } from 'libs/contracts/src/BuildingDetails/buildingdetails.patterns';
// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'

@Injectable()
export class BuildingDetailService {
  constructor(@Inject(BUILDING_CLIENT) private readonly buildingsClient: ClientProxy) {}

  // Get all BuildingDetails
  async getBuildingDetails() {
    try {
      // Call the microservice to get all building details
      const buildingDetails = await this.buildingsClient.send(BUILDINGDETAIL_PATTERN.GET, {});
      return buildingDetails;
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching building details.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Create a BuildingDetail
  async createBuildingDetail(createBuildingDetailDto: any) {
    try {
      // Call the microservice to create a new building detail
      const newBuildingDetail = await this.buildingsClient.send(BUILDINGDETAIL_PATTERN.CREATE, createBuildingDetailDto);
      return newBuildingDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating building detail.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get BuildingDetail by ID
  async getBuildingDetailById(buildingDetailId: string) {
    try {
      const buildingDetail = await this.buildingsClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId });
      return buildingDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching building detail by ID.',
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Update BuildingDetail
  async updateBuildingDetail(updateBuildingDetailDto: any) {
    try {
      const updatedBuildingDetail = await this.buildingsClient.send(BUILDINGDETAIL_PATTERN.UPDATE, updateBuildingDetailDto);
      return updatedBuildingDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while updating building detail.',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Delete BuildingDetail by ID
  async deleteBuildingDetail(buildingDetailId: string) {
    try {
      const deletedBuildingDetail = await this.buildingsClient.send(BUILDINGDETAIL_PATTERN.DELETE, { buildingDetailId });
      return deletedBuildingDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while deleting building detail.',
        HttpStatus.NOT_FOUND
      );
    }
  }
}