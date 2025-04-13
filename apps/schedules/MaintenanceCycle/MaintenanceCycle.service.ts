import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/create-MaintenanceCycle.dto';
import { UpdateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/update-MaintenanceCycle.dto';
import { MaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';
import { PaginationParams, PaginationResponseDto } from '@app/contracts/Pagination/pagination.dto';

@Injectable()
export class MaintenanceCycleService {
  private readonly logger = new Logger(MaintenanceCycleService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateMaintenanceCycleDto): Promise<ApiResponse<MaintenanceCycleDto>> {
    try {
      const cycle = await this.prisma.maintenanceCycle.create({
        data: createDto,
      });

      return new ApiResponse<MaintenanceCycleDto>(
        true,
        'Maintenance cycle created successfully',
        cycle
      );
    } catch (error) {
      this.logger.error('Error creating maintenance cycle:', error);
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to create maintenance cycle',
      });
    }
  }

  async findAll(paginationParams?: PaginationParams): Promise<PaginationResponseDto<MaintenanceCycleDto>> {
    try {
      const page = Math.max(1, paginationParams?.page || 1);
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10));
      const skip = (page - 1) * limit;

      const [cycles, total] = await Promise.all([
        this.prisma.maintenanceCycle.findMany({
          skip,
          take: limit,
          //orderBy: { createdAt: 'desc' },
        }),
        this.prisma.maintenanceCycle.count(),
      ]);

      return new PaginationResponseDto<MaintenanceCycleDto>(
        cycles,
        total,
        page,
        limit,
        200,
        cycles.length > 0 ? 'Maintenance cycles retrieved successfully' : 'No maintenance cycles found',
      );
    } catch (error) {
      this.logger.error('Error retrieving maintenance cycles:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving maintenance cycles',
      });
    }
  }

  async findById(cycle_id: string): Promise<ApiResponse<MaintenanceCycleDto>> {
    try {
      const cycle = await this.prisma.maintenanceCycle.findUnique({
        where: { cycle_id },
      });

      if (!cycle) {
        throw new RpcException({
          statusCode: 404,
          message: 'Maintenance cycle not found',
        });
      }

      return new ApiResponse<MaintenanceCycleDto>(
        true,
        'Maintenance cycle retrieved successfully',
        cycle
      );
    } catch (error) {
      this.logger.error(`Error retrieving maintenance cycle with ID ${cycle_id}:`, error);
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Error retrieving maintenance cycle',
      });
    }
  }

  async update(cycle_id: string, updateDto: UpdateMaintenanceCycleDto): Promise<ApiResponse<MaintenanceCycleDto>> {
    try {
      const cycle = await this.prisma.maintenanceCycle.update({
        where: { cycle_id },
        data: updateDto,
      });

      return new ApiResponse<MaintenanceCycleDto>(
        true,
        'Maintenance cycle updated successfully',
        cycle
      );
    } catch (error) {
      this.logger.error(`Error updating maintenance cycle with ID ${cycle_id}:`, error);
      throw new RpcException({
        statusCode: error.code === 'P2025' ? 404 : 500,
        message: error.code === 'P2025' ? 'Maintenance cycle not found' : 'Error updating maintenance cycle',
      });
    }
  }

  async delete(cycle_id: string): Promise<ApiResponse<MaintenanceCycleDto>> {
    try {
      const cycle = await this.prisma.maintenanceCycle.delete({
        where: { cycle_id },
      });

      return new ApiResponse<MaintenanceCycleDto>(
        true,
        'Maintenance cycle deleted successfully',
        cycle
      );
    } catch (error) {
      this.logger.error(`Error deleting maintenance cycle with ID ${cycle_id}:`, error);
      throw new RpcException({
        statusCode: error.code === 'P2025' ? 404 : 500,
        message: error.code === 'P2025' ? 'Maintenance cycle not found' : 'Error deleting maintenance cycle',
      });
    }
  }
} 