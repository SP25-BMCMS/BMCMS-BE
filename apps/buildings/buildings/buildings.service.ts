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
  ) { }

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

  // Update readBuilding to support pagination
  async readBuilding(paginationParams?: { page?: number; limit?: number; search?: string }) {
    try {
      // Default values if not provided
      const page = paginationParams?.page || 1;
      const limit = paginationParams?.limit || 10;
      const search = paginationParams?.search || '';

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Create where condition for search
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get paginated data
      const [buildings, total] = await Promise.all([
        this.prisma.building.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.building.count({ where })
      ]);

      if (buildings.length === 0) {
        return {
          statusCode: 200,
          message: 'No buildings found',
          data: [],
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit))
          }
        };
      }

      return {
        statusCode: 200,
        message: 'Buildings retrieved successfully',
        data: buildings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit))
        }
      };
    } catch (error) {
      console.error('Error retrieving buildings:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving buildings!'
      });
    }
  }

  // Update an existing building
  async getBuildingById(buildingId: string) {
    try {
      console.log(`[BuildingsService] Fetching building with ID: ${buildingId}`);

      if (!buildingId) {
        console.error('[BuildingsService] Building ID is null or undefined');
        return {
          statusCode: 400,
          message: 'Invalid building ID provided',
        };
      }

      const building = await this.prisma.building.findUnique({
        where: { buildingId },
        include: {
          area: true // Include related area information if needed
        }
      });

      if (!building) {
        console.log(`[BuildingsService] Building not found for ID: ${buildingId}`);
        return {
          statusCode: 404,
          message: 'Building not found',
        };
      }

      console.log(`[BuildingsService] Successfully retrieved building: ${buildingId}`);
      return {
        statusCode: 200,
        message: 'Building retrieved successfully',
        data: building,
      };
    } catch (error) {
      console.error('[BuildingsService] Error in getBuildingById:', error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2023') {
          return {
            statusCode: 400,
            message: 'Invalid UUID format for building ID',
          };
        }
        return {
          statusCode: 404,
          message: 'Building not found or database error',
        };
      }

      return {
        statusCode: 500,
        message: 'Internal server error while retrieving building',
      };
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
  async deleteBuilding(buildingId: string) {
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
        message: 'Building deletion failed' + error.message,
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

      if (!buildingId) {
        console.error('Building ID is required');
        return null;
      }

      const building = await this.prisma.building.findUnique({
        where: { buildingId },
      });

      if (!building) {
        console.log(`Building with ID ${buildingId} not found`);
        return null;
      }

      console.log(`Building with ID ${buildingId} exists`);
      return building;
    } catch (error) {
      console.error('Error checking building existence:', error);
      throw error;
    }
  }
}