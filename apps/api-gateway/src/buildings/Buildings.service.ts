import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { BUILDING_CLIENT } from '../constraints'
import { BUILDINGS_PATTERN } from 'libs/contracts/src/buildings/buildings.patterns'
import { firstValueFrom } from 'rxjs'
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto'

@Injectable()
export class BuildingsService {
  constructor(
    @Inject(BUILDING_CLIENT) private readonly buildingsClient: ClientProxy,
  ) { }

  // Get all buildings with pagination support
  async getBuildings(paginationParams?: PaginationParams) {
    try {
      console.log(
        '🚀 ~ BuildingsService ~ getBuildings ~ paginationParams:',
        paginationParams,
      )

      // Call the microservice via ClientProxy with pagination parameters
      const buildingsObservable = this.buildingsClient.send(
        BUILDINGS_PATTERN.GET,
        paginationParams || {},
      )
      const buildings = await firstValueFrom(buildingsObservable)
      return buildings
    } catch (error) {
      console.error('Error in getBuildings:', error)
      throw new HttpException(
        'Error occurred while fetching buildings.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // Create a building

  async createBuilding(createBuildingDto: any) {
    try {
      const newBuilding = await this.buildingsClient.send(
        BUILDINGS_PATTERN.CREATE,
        createBuildingDto,
      )
      return newBuilding
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating building.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  // Get building by ID
  async getBuildingById(buildingId: string) {
    try {
      console.log(
        '🚀 ~ Buildings2313212313Service ~ getBuildingById ~ buildingId:',
        buildingId,
      )
      const buildingObservable = this.buildingsClient.send(
        BUILDINGS_PATTERN.GET_BY_ID,
        { buildingId },
      )
      const building = await firstValueFrom(buildingObservable)
      console.log(
        '🚀 ~ BuildingsService ~ getBuildingById ~ building:',
        building,
      )
      return building
    } catch (error) {
      console.error('🚀 ~ BuildingsService ~ getBuildingById ~ error:', error)
      throw new HttpException(
        'Error occurred while fetching building by ID.',
        HttpStatus.NOT_FOUND,
      )
    }
  }

  // Get apartment with building details
  async getApartmentWithBuilding(apartmentId: string) {
    try {
      console.log(
        '🚀 ~ BuildingsService ~ getApartmentWithBuilding ~ apartmentId:',
        apartmentId,
      )

      // First get the apartment to extract buildingId
      const apartmentResponse =
        await this.getApartmentByIdFromBuilding(apartmentId)
      console.log(
        '🚀 ~ BuildingsService ~ getApartmentWithBuilding ~ apartmentResponse:',
        apartmentResponse,
      )

      if (!apartmentResponse || !apartmentResponse.data) {
        throw new HttpException(
          `Apartment with ID ${apartmentId} not found`,
          HttpStatus.NOT_FOUND,
        )
      }

      // Extract buildingId from apartment
      const buildingId = apartmentResponse.data.buildingId
      console.log(
        '🚀 ~ BuildingsService ~ getApartmentWithBuilding ~ buildingId:',
        buildingId,
      )

      // Get building details
      const buildingResponse = await this.getBuildingById(buildingId)
      console.log(
        '🚀 ~ BuildingsService ~ getApartmentWithBuilding ~ buildingResponse:',
        buildingResponse,
      )

      // Combine the data
      return {
        statusCode: 200,
        message: 'Apartment with building details retrieved successfully',
        data: {
          apartment: apartmentResponse.data,
          building: buildingResponse?.data || null,
        },
      }
    } catch (error) {
      console.error(
        '🚀 ~ BuildingsService ~ getApartmentWithBuilding ~ error:',
        error,
      )
      throw new HttpException(
        `Error retrieving apartment with building details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getApartmentByIdFromBuilding(apartmentId: string) {
    try {
      const apartmentObservable = this.buildingsClient.send(
        'get_apartment_by_id',
        { apartmentId },
      )
      const apartment = await firstValueFrom(apartmentObservable)
      return apartment
    } catch (error) {
      console.error(
        '🚀 ~ BuildingsService ~ getApartmentByIdFromBuilding ~ error:',
        error,
      )
      throw new Error(`Error fetching apartment: ${error.message}`)
    }
  }

  // Update a building
  async updateBuilding(updateBuildingDto: any) {
    try {
      const updatedBuilding = await this.buildingsClient.send(
        BUILDINGS_PATTERN.UPDATE,
        updateBuildingDto,
      )
      return updatedBuilding
    } catch (error) {
      throw new HttpException(
        'Error occurred while updating building.',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  // Delete a building by ID
  async deleteBuilding(buildingId: string) {
    try {
      const deletedBuilding = await this.buildingsClient.send(
        BUILDINGS_PATTERN.DELETE,
        { buildingId },
      )
      return deletedBuilding
    } catch (error) {
      throw new HttpException(
        'Error occurred while deleting building.',
        HttpStatus.NOT_FOUND,
      )
    }
  }

  // Get all residents by building ID
  async getAllResidentsByBuildingId(buildingId: string) {
    try {
      const residentsObservable = this.buildingsClient.send(
        BUILDINGS_PATTERN.GET_RESIDENTS_BY_BUILDING_ID,
        buildingId
      );
      const residents = await firstValueFrom(residentsObservable);
      return residents;
    } catch (error) {
      console.error('Error in getAllResidentsByBuildingId:', error);
      throw new HttpException(
        'Error occurred while fetching residents.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
