import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
 import { BUILDING_CLIENT } from '../constraints'
import { BUILDINGS_PATTERN } from 'libs/contracts/src/buildings/buildings.patterns';
// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'

@Injectable()
export class BuildingsService {
  constructor(@Inject(BUILDING_CLIENT) private readonly buildingsClient: ClientProxy) {}

  // Get all buildings
  async getBuildings() {
    try {
      // Call the microservice via ClientProxy
      const buildings = await this.buildingsClient.send(BUILDINGS_PATTERN.GET, {});
      return buildings;
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching buildings.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Create a building

  async createBuilding(createBuildingDto: any) {
    try {
      const newBuilding = await this.buildingsClient.send(BUILDINGS_PATTERN.CREATE, createBuildingDto);
      return newBuilding;
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating building.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


  // Get building by ID
  async getBuildingById(buildingId: string) {
    try {
      const building = await this.buildingsClient.send(BUILDINGS_PATTERN.GET_BY_ID, { buildingId });
      return building;
    } catch (error) {
      throw new HttpException(
        'Error occurred while fetching building by ID.',
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Update a building
  async updateBuilding(updateBuildingDto: any) {
    try {
      const updatedBuilding = await this.buildingsClient.send(BUILDINGS_PATTERN.UPDATE, updateBuildingDto);
      return updatedBuilding;
    } catch (error) {
      throw new HttpException(
        'Error occurred while updating building.',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Delete a building by ID
  async deleteBuilding(buildingId: string) {
    try {
      const deletedBuilding = await this.buildingsClient.send(BUILDINGS_PATTERN.DELELTE, { buildingId });
      return deletedBuilding;
    } catch (error) {
      throw new HttpException(
        'Error occurred while deleting building.',
        HttpStatus.NOT_FOUND
      );
    }
  }
}