import { CreateBuildingDetailDto } from '@app/contracts/BuildingDetails/create-buildingdetails.dto';
import { UpdateBuildingDetailDto } from '@app/contracts/BuildingDetails/update.buildingdetails';
import { Injectable } from '@nestjs/common';
import { Payload, RpcException } from '@nestjs/microservices';
import { PrismaClient  } from '@prisma/client-building';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
@Injectable()
export class BuildingDetailsService {
  private prisma = new PrismaClient();

  async createBuildingDetail(createBuildingDetailDto: CreateBuildingDetailDto) {
    try {
      const newBuildingDetail = await this.prisma.buildingDetail.create({
        data: {
          name: createBuildingDetailDto.name,
          description: createBuildingDetailDto.description,
          floorNumber: createBuildingDetailDto.floorNumber,
          buildingId: createBuildingDetailDto.buildingId,
          areaType: createBuildingDetailDto.areaType,
         // locationDetails: BuildingDetailDto.locationDetails,  // Nếu có dữ liệu locationDetails
        },
      });
      return {
        statusCode: 201,
        message: 'Building Detail created successfully',
        data: newBuildingDetail,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Building Detail creation failed',
      });
    }
  }

  async getAllBuildingDetails() {
    try {
      const buildingDetails = await this.prisma.buildingDetail.findMany();
      return {
        statusCode: 200,
        message: 'Building Details fetched successfully',
        data: buildingDetails,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving building details',
      });
    }
  }

  async getBuildingDetailById(buildingDetailId: string) {
    try {
      const buildingDetail = await this.prisma.buildingDetail.findUnique({
        where: { buildingDetailId },
      });
      if (!buildingDetail) {
        return {
          statusCode: 404,
          message: 'Building Detail not found',
        };
      }
      return {
        statusCode: 200,
        message: 'Building Detail retrieved successfully',
        data: buildingDetail,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving building detail',
      });
    }
  }

  async updateBuildingDetail(buildingDetailId: string, updateBuildingDetailDto: UpdateBuildingDetailDto) {
    try {
      const updatedBuildingDetail = await this.prisma.buildingDetail.update({
        where: { buildingDetailId },
        data: {
          name: updateBuildingDetailDto.name,
          description: updateBuildingDetailDto.description,
          floorNumber: updateBuildingDetailDto.floorNumber,
//          buildingId: updateBuildingDetailDto.buildingId,
          areaType: updateBuildingDetailDto.areaType,
         // locationDetails: updateBuildingDetailDto.locationDetails, // Nếu có thay đổi locationDetails
        },
      });
      return {
        statusCode: 200,
        message: 'Building Detail updated successfully',
        data: updatedBuildingDetail,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Building Detail update failed',
      });
    }
  }

  async deleteBuildingDetail(buildingDetailId: string) {
    try {
      await this.prisma.buildingDetail.delete({
        where: { buildingDetailId },
      });
      return {
        statusCode: 200,
        message: 'Building Detail deleted successfully',
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Building Detail deletion failed',
      });
    }
  }
}