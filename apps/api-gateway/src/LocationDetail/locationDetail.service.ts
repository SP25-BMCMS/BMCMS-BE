import { LOCATIONDETAIL_PATTERN } from '@app/contracts/LocationDetails/Locationdetails.patterns'
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
 import { BUILDING_CLIENT } from '../constraints'
// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'
@Injectable()
export class LocationDetailService {
  constructor(@Inject(BUILDING_CLIENT) private readonly buildingsClient: ClientProxy) {}

  // Get all LocationDetails
  async getLocationDetails() {
    try {
      // Call the microservice to get all location details
      const locationDetails = await this.buildingsClient.send(LOCATIONDETAIL_PATTERN.GET, {});
      return locationDetails;
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching location details.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Create a LocationDetail
  async createLocationDetail(createLocationDetailDto: any) {
    try {
      // Call the microservice to create a new location detail
      const newLocationDetail = await this.buildingsClient.send(LOCATIONDETAIL_PATTERN.CREATE, createLocationDetailDto);
      return newLocationDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating location detail.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get LocationDetail by ID
  async getLocationDetailById(locationDetailId: string) {
    try {
      const locationDetail = await this.buildingsClient.send(LOCATIONDETAIL_PATTERN.GET_BY_ID, { locationDetailId });
      return locationDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching location detail by ID.',
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Update LocationDetail
  async updateLocationDetail( updateLocationDetailDto: any) {
    try {
      const updatedLocationDetail = await this.buildingsClient.send(LOCATIONDETAIL_PATTERN.UPDATE, updateLocationDetailDto);
      return updatedLocationDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while updating location detail.',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Delete LocationDetail by ID
  async deleteLocationDetail(locationDetailId: string) {
    try {
      const deletedLocationDetail = await this.buildingsClient.send(LOCATIONDETAIL_PATTERN.DELETE, { locationDetailId });
      return deletedLocationDetail;
    } catch (error) {
      throw new HttpException(
        'Error occurred while deleting location detail.',
        HttpStatus.NOT_FOUND
      );
    }
  }
}