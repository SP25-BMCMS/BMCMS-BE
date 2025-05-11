import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BUILDING_CLIENT } from '../constraints';
import { BUILDINGDETAIL_PATTERN } from 'libs/contracts/src/BuildingDetails/buildingdetails.patterns';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { firstValueFrom } from 'rxjs';
// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'

@Injectable()
export class BuildingDetailService {
  constructor(
    @Inject(BUILDING_CLIENT) private readonly buildingsClient: ClientProxy,
  ) { }

  // Get all BuildingDetails
  async getBuildingDetails(paginationParams?: PaginationParams) {
    try {
      // Call the microservice to get all building details with pagination
      const buildingDetails = await this.buildingsClient.send(
        BUILDINGDETAIL_PATTERN.GET,
        paginationParams || {},
      );
      return buildingDetails;
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching building details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Create a BuildingDetail
  async createBuildingDetail(createBuildingDetailDto: any) {
    try {
      // Call the microservice to create a new building detail
      const newBuildingDetail = await this.buildingsClient.send(
        BUILDINGDETAIL_PATTERN.CREATE,
        createBuildingDetailDto,
      );
      return newBuildingDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating building detail.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get BuildingDetail by ID
  async getBuildingDetailById(buildingDetailId: string) {
    try {
      const buildingDetail = await this.buildingsClient.send(
        BUILDINGDETAIL_PATTERN.GET_BY_ID,
        { buildingDetailId },
      );
      return buildingDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching building detail by ID.',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Update BuildingDetail
  async updateBuildingDetail(updateBuildingDetailDto: any) {
    try {
      const updatedBuildingDetail = await this.buildingsClient.send(
        BUILDINGDETAIL_PATTERN.UPDATE,
        updateBuildingDetailDto,
      );
      return updatedBuildingDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while updating building detail.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Delete BuildingDetail by ID
  async deleteBuildingDetail(buildingDetailId: string) {
    try {
      if (!buildingDetailId) {
        throw new HttpException(
          'Building detail ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(`[BuildingDetailService] Attempting to delete building detail with ID: ${buildingDetailId}`);

      const deletedBuildingDetailObservable = this.buildingsClient.send(
        BUILDINGDETAIL_PATTERN.DELETE,
        { buildingDetailId }
      );

      const response = await firstValueFrom(deletedBuildingDetailObservable);

      // Handle different response statuses from the microservice
      if (response.statusCode === 404) {
        throw new HttpException(
          response.message || 'Building detail not found',
          HttpStatus.NOT_FOUND
        );
      }

      return response;
    } catch (error) {
      console.error('[BuildingDetailService] Error in deleteBuildingDetail:', error);

      // If it's already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Otherwise, create a new HttpException
      throw new HttpException(
        error.message || 'Error occurred while deleting building detail and related data',
        error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
