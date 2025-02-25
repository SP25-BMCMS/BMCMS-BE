import { CreateLocationDetailDto } from '@app/contracts/LocationDetails/create-locationdetails.dto';
import { UpdateLocationDetailDto } from '@app/contracts/LocationDetails/update.locationdetails';
import { Injectable } from '@nestjs/common';
import { Payload, RpcException } from '@nestjs/microservices';
import { PrismaClient  } from '@prisma/client-building';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
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
        message: 'LocationDetail creation failed :' +error.message,
      });
    }
  }

  async updateLocationDetail(locationDetailId: string, updateLocationDetailDto: UpdateLocationDetailDto) {
    try {
      const updatedLocationDetail = await this.prisma.locationDetail.update({
        where: { locationDetailId },
        data: updateLocationDetailDto, // Ensure this aligns with the Prisma input type
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

  async getAllLocationDetails() {
    try {
      const locationDetails = await this.prisma.locationDetail.findMany();
      return {
        statusCode: 200,
        message: 'LocationDetails fetched successfully',
        data: locationDetails,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving LocationDetails',
      });
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