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
  constructor(private prisma: PrismaService) { }

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
        message: 'Tạo khu vực thành công',
        data: newArea,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Tạo khu vực thất bại',
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
          message: 'Không tìm thấy khu vực nào',
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
            ? 'Lấy danh sách khu vực thành công'
            : 'Không tìm thấy khu vực nào cho trang này',
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
      console.log('AreasService searching for area with ID:', areaId);
      const area = await this.prismaClient.area.findUnique({
        where: { areaId },
        include: {
          buildings: true
        }
      });

      console.log('AreasService found area:', area);

      if (!area) {
        console.log('AreasService: Area not found');
        return {
          statusCode: 404,
          message: 'Không tìm thấy khu vực',
        };
      }
      console.log('AreasService: Returning area data');
      return {
        statusCode: 200,
        message: 'Lấy thông tin khu vực thành công',
        data: area,
      };
    } catch (error) {
      console.error('AreasService Error in getAreaById:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy thông tin khu vực',
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
        message: 'Cập nhật khu vực thành công',
        data: updatedArea,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Cập nhật khu vực thất bại',
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
        message: 'Xóa khu vực thành công',
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Xóa khu vực thất bại',
      });
    }
  }
}
