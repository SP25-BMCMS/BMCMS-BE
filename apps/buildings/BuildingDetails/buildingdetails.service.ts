import { Injectable } from '@nestjs/common';
import { Payload, RpcException } from '@nestjs/microservices';
import { PrismaClient  } from '@prisma/client-building';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateBuildingDetailDto } from 'libs/contracts/src/BuildingDetails/create-buildingdetails.dto';
import { UpdateBuildingDetailDto } from 'libs/contracts/src/BuildingDetails/update.buildingdetails';
import { PrismaService } from '../../users/prisma/prisma.service';
import { PaginationParams, PaginationResponseDto } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class BuildingDetailsService {
  private prisma = new PrismaClient();

  constructor(private prismaService: PrismaService) {}

  async createBuildingDetail(createBuildingDetailDto: CreateBuildingDetailDto) {
    try {
      const newBuildingDetail = await this.prisma.buildingDetail.create({
        data: {
          name: createBuildingDetailDto.name,
        //  description: createBuildingDetailDto.description,
        total_apartments: createBuildingDetailDto.floorNumber,
          buildingId: createBuildingDetailDto.buildingId,
         // areaType: createBuildingDetailDto.areaType,
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

  async getAllBuildingDetails(paginationParams: PaginationParams = { page: 1, limit: 10 }): Promise<PaginationResponseDto<any>> {
    try {
      const page = Number(paginationParams.page) || 1;
      const limit = Number(paginationParams.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.prisma.buildingDetail.count();

      // Get paginated building details
      const buildingDetails = await this.prisma.buildingDetail.findMany({
        skip,
        take: limit,
        include: {
          building: true,
          locationDetails: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const responseData = {
        statusCode: 200,
        message: 'Danh sách chi tiết tòa nhà',
        data: buildingDetails,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      return responseData;
    } catch (error) {
      console.error('Error in getAllBuildingDetails:', error);
      const errorData = {
        statusCode: 500,
        message: error.message,
        data: [],
        pagination: {
          total: 0,
          page: Number(paginationParams.page) || 1,
          limit: Number(paginationParams.limit) || 10,
          totalPages: 0
        }
      };

      return errorData;
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
         // description: updateBuildingDetailDto.description,
        //  floorNumber: updateBuildingDetailDto.floorNumber,
//          buildingId: updateBuildingDetailDto.buildingId,
        //  areaType: updateBuildingDetailDto.areaType,
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