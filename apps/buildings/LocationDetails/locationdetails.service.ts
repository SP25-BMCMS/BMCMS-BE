import { Injectable } from '@nestjs/common';
import { Payload, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client-building';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateLocationDetailDto } from 'libs/contracts/src/LocationDetails/create-locationdetails.dto';
import { UpdateLocationDetailDto } from 'libs/contracts/src/LocationDetails/update.locationdetails';
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class LocationDetailService {
  private prisma = new PrismaClient();

  async createLocationDetail(createLocationDetailDto: CreateLocationDetailDto) {
    try {
      const newLocationDetail = await this.prisma.locationDetail.create({
        data: createLocationDetailDto,
      });
      return {
        statusCode: 201,
        message: 'LocationDetail created successfully',
        data: newLocationDetail,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'LocationDetail creation failed :' + error.message,
      });
    }
  }

  async updateLocationDetail(
    locationDetailId: string,
    updateLocationDetailDto: UpdateLocationDetailDto,
  ) {
    try {
      const updatedLocationDetail = await this.prisma.locationDetail.update({
        where: { locationDetailId },
        data: updateLocationDetailDto, 
      });
      return {
        statusCode: 200,
        message: 'LocationDetail updated successfully',
        data: updatedLocationDetail,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'LocationDetail update failed',
      });
    }
  }

  async getAllLocationDetails(
    paginationParams: PaginationParams = { page: 1, limit: 10 },
  ): Promise<PaginationResponseDto<any>> {
    try {
      const page = Number(paginationParams.page) || 1;
      const limit = Number(paginationParams.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.prisma.locationDetail.count();

      // Get paginated location details
      const locationDetails = await this.prisma.locationDetail.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const responseData = {
        statusCode: 200,
        message: 'Location details retrieved successfully',
        data: locationDetails,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      return responseData;
    } catch (error) {
      console.error('Error in getAllLocationDetails:', error);
      const errorData = {
        statusCode: 500,
        message: error.message,
        data: [],
        pagination: {
          total: 0,
          page: Number(paginationParams.page) || 1,
          limit: Number(paginationParams.limit) || 10,
          totalPages: 0,
        },
      };

      return errorData;
    }
  }

  async getLocationDetailById(locationDetailId: string) {
    try {
      const locationDetail = await this.prisma.locationDetail.findUnique({
        where: { locationDetailId },
      });
      return {
        statusCode: 200,
        message: 'LocationDetail retrieved successfully',
        data: locationDetail,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 404,
        message: 'LocationDetail not found',
      });
    }
  }

  async deleteLocationDetail(locationDetailId: string) {
    try {
      await this.prisma.locationDetail.delete({
        where: { locationDetailId },
      });
      return {
        statusCode: 200,
        message: 'LocationDetail deleted successfully',
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'LocationDetail deletion failed',
      });
    }
  }
}
