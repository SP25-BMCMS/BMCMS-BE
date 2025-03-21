import { Injectable, Inject } from '@nestjs/common';
import { Payload, RpcException, ClientProxy } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client-building';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UUID } from 'crypto';
import { date } from 'joi';
import { buildingsDto } from 'libs/contracts/src/buildings/buildings.dto';
import { CreateBuildingDto } from 'libs/contracts/src/buildings/create-buildings.dto';
import { UpdateBuildingDto } from 'libs/contracts/src/buildings/update-buildings.dto';
import { Observable } from 'rxjs';
import { firstValueFrom, lastValueFrom } from 'rxjs';

// Interface for UserService
interface UserService {
  getApartmentById(data: { apartmentId: string }): Observable<any>;
}

@Injectable()
export class BuildingsService {

  private prisma = new PrismaClient();

  constructor(
    @Inject('USERS_CLIENT') private readonly usersClient: ClientProxy
  ) {}

  // Add this method to forward apartment requests to the users service
  async getApartmentById(apartmentId: string) {
    try {
      console.log("🚀 ~ BuildingsService ~ getApartmentById ~ apartmentId:", apartmentId);
      
      // Forward the request to the Users service
      const apartmentResponse = await firstValueFrom(
        this.usersClient.send('get_apartment_by_id', { apartmentId })
      );
      
      return apartmentResponse;
    } catch (error) {
      console.error("Error getting apartment from users service:", error);
      throw new RpcException({
        statusCode: 500,
        message: `Error fetching apartment data: ${error.message}`
      });
    }
  }

  // Create a new building
  async createBuilding(CreateBuildingDto: CreateBuildingDto) {

    try {
      const newBuilding = await this.prisma.building.create({
        data: {
          name: CreateBuildingDto.name,
          description: CreateBuildingDto.description,
          numberFloor: CreateBuildingDto.numberFloor,
          imageCover: CreateBuildingDto.imageCover,
          areaId: CreateBuildingDto.areaId,
          Status: CreateBuildingDto.status,
          construction_date: CreateBuildingDto.construction_date,
          completion_date: CreateBuildingDto.completion_date
        },
      });

      // if(!newBuilding){
      //   return {
      //     statusCode: 500,
      //     message: 'Something wwrong wwhile created',
      //     data: newBuilding,
      //   };

      // }
      return {
        statusCode: 201,
        message: 'Building created successfully',
        data: newBuilding,
      };
    } catch (error) {
      console.error('Error during building creation:', error);

      throw new RpcException({
        statusCode: 400,
        message: 'Building creation failed',
      });
    }
  }

  // Read a building by buildingId
  async readBuilding() {
    try {
      const getBuilding = await this.prisma.building.findMany({
      });
      if (getBuilding == null) {
        return {
          statusCode: 404,
          message: 'No Building',
        };
      }

      return {
        statusCode: 200,
        message: 'get Building successfully',
        data: getBuilding,
      };

    } catch (error) {
      throw new RpcException({ statusCode: 500, message: 'Error retrieving buildings!' })

    }


  }

  // Update an existing building
  async getBuildingById(buildingId: string) {
    try {
      console.log("🚀 ~ BuildingsService ~ getBuildingById ~ buildingId:", buildingId)
      console.log("SSDASDAASDASDASSD" + typeof buildingId); // Should print 'string'

      const building = await this.prisma.building.findUnique({
        where: { buildingId },
      });
      console.log("🚀 ~ BuildingsService ~ getBuildingById ~ buildingId:", buildingId)

      if (!building) {
        return {
          statusCode: 404,
          message: 'Building not found',
        };
      }

      return {
        statusCode: 200,
        message: 'Building retrieved successfully',
        data: building,
      };
    } catch (error) {
      console.log("🚀 ~ BuildingsService ~ getBuildingById ~ error:", error)
      console.log("🚀 ~ BuildingsService ~ getBuildingById ~ error:", error)
      console.log("🚀 ~ BuildingsService ~ getBuildingById ~ error:", error)

      if (error instanceof PrismaClientKnownRequestError) {
        return {
          statusCode: 404,
          message: 'Building not found',
        };
      }
      throw new RpcException({
        statusCode: 501,
        message: 'Error retrieving building!',
      });
    }
  }

  // Update an existing building
  async updateBuilding(UpdateBuildingDto: UpdateBuildingDto) {
    try {
      const updatedBuilding = await this.prisma.building.update({
        where: {
          buildingId: UpdateBuildingDto.buildingId,
        },
        data: {
          name: UpdateBuildingDto.name,
          description: UpdateBuildingDto.description,
          numberFloor: UpdateBuildingDto.numberFloor,
          imageCover: UpdateBuildingDto.imageCover,
          areaId: UpdateBuildingDto.areaId,
          Status: UpdateBuildingDto.status,
          construction_date: UpdateBuildingDto.construction_date,
          completion_date: UpdateBuildingDto.completion_date
        },
      });

      return {
        statusCode: 200,
        message: 'Building updated successfully',
        data: updatedBuilding,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Building update failed',
      });
    }
  }

  // Delete a building by buildingId
  async deleteBuilding(buildingId: UUID) {
    try {
      const deletedBuilding = await this.prisma.building.delete({
        where: { buildingId },
      });

      return {
        statusCode: 200,
        message: 'Building deleted successfully',
        data: deletedBuilding,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Building deletion failed',
      });
    }
  }

  async checkAreaExists(areaName: string) {
    console.log(`Checking area existence for: ${areaName}`);
    const area = await this.prisma.area.findFirst({
      where: { name: areaName }
    });

    console.log(`Area check result: ${area ? 'Found' : 'Not Found'}`);
    return area;
  }

  async checkBuildingExists(buildingId: string) {
    try {
      console.log(`Checking building existence for ID: ${buildingId}`);

      const building = await this.prisma.building.findUnique({
        where: { buildingId },
      });

      if (!building) {
        console.log(`Building with ID ${buildingId} not found`);
        return {
          statusCode: 404,
          message: `Building with ID ${buildingId} not found`,
          exists: false
        };
      }

      console.log(`Building with ID ${buildingId} exists`);
      return {
        statusCode: 200,
        message: 'Building exists',
        exists: true,
        data: building
      };
    } catch (error) {
      console.error('Error checking building existence:', error);
      return {
        statusCode: 500,
        message: 'Error checking building existence',
        exists: false
      };
    }
  }
}