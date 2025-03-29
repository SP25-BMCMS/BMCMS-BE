import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-building';
import { RpcException } from '@nestjs/microservices';
import { CreateAreaDto } from 'libs/contracts/src/Areas/create-areas.dto';
import { UpdateAreaDto } from 'libs/contracts/src/Areas/update.areas';
import { PrismaService } from '../../users/prisma/prisma.service';
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  private prismaClient = new PrismaClient();
  //constructor(private readonly prisma: PrismaClient) // Inject PrismaService

  // Create a new area
  async createArea(createAreaDto: CreateAreaDto) {
    try {
      const newArea = await this.prismaClient.area.create({
        data: {
          name: createAreaDto.name,
          description: createAreaDto.description,
        },
      });
      return {
        statusCode: 201,
        message: 'Area created successfully',
        data: newArea,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Area creation failed',
      });
    }
  }

  // Get all areas
  async getAllAreas(
    paginationParams: PaginationParams,
  ): Promise<PaginationResponseDto<any>> {
    try {
      // Default values if not provided
      const page = Math.max(1, paginationParams?.page || 1);
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10));
      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.prismaClient.area.count();

      // If no areas found at all
      if (total === 0) {
        return {
          statusCode: 404,
          message: 'No areas found',
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      // Get paginated areas
      const areas = await this.prismaClient.area.findMany({
        skip,
        take: limit,
        include: {
          buildings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        statusCode: 200,
        message:
          areas.length > 0
            ? 'Areas fetched successfully'
            : 'No areas found for this page',
        data: areas,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in getAllAreas:', error);
      return {
        statusCode: 500,
        message: error.message,
        data: [],
        pagination: {
          total: 0,
          page: paginationParams?.page || 1,
          limit: paginationParams?.limit || 10,
          totalPages: 0,
        },
      };
    }
  }

  // Get area by ID
  async getAreaById(areaId: string) {
    try {
      const area = await this.prismaClient.area.findUnique({
        where: { areaId },
      });
      if (!area) {
        return {
          statusCode: 404,
          message: 'Area not found',
        };
      }
      return {
        statusCode: 200,
        message: 'Area retrieved successfully',
        data: area,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving area',
      });
    }
  }

  // Update area
  async updateArea(areaId: string, updateAreaDto: UpdateAreaDto) {
    try {
      const updatedArea = await this.prismaClient.area.update({
        where: { areaId },
        data: {
          description: updateAreaDto.description,
          name: updateAreaDto.name,
        },
      });
      return {
        statusCode: 200,
        message: 'Area updated successfully',
        data: updatedArea,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Area update failed',
      });
    }
  }

  // Delete area
  async deleteArea(areaId: string) {
    try {
      await this.prismaClient.area.delete({
        where: { areaId },
      });
      return {
        statusCode: 200,
        message: 'Area deleted successfully',
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Area deletion failed',
      });
    }
  }
}
