import { Injectable, Logger } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/create-MaintenanceCycle.dto'
import { UpdateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/update-MaintenanceCycle.dto'
import { MaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.dto'
import { MaintenanceCycleHistoryDto } from '@app/contracts/MaintenanceCycle/MaintenanceCycleHistory.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { PaginationParams, PaginationResponseDto } from '@app/contracts/Pagination/pagination.dto'
import { DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-schedule'

@Injectable()
export class MaintenanceCycleService {
  private readonly logger = new Logger(MaintenanceCycleService.name);

  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateMaintenanceCycleDto): Promise<ApiResponse<MaintenanceCycleDto>> {
    try {
      const cycle = await this.prisma.maintenanceCycle.create({
        data: createDto,
      })

      return new ApiResponse<MaintenanceCycleDto>(
        true,
        'Tạo chu kỳ bảo trì thành công',
        cycle
      )
    } catch (error) {
      this.logger.error('Error creating maintenance cycle:', error)
      throw new RpcException({
        statusCode: 400,
        message: 'Không thể tạo chu kỳ bảo trì',
      })
    }
  }

  async findAll(
    paginationParams?: PaginationParams,
    device_type?: DeviceType,
    basis?: MaintenanceBasis,
    frequency?: Frequency
  ): Promise<PaginationResponseDto<MaintenanceCycleDto>> {
    try {
      const page = Math.max(1, paginationParams?.page || 1)
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10))
      const skip = (page - 1) * limit

      const where = {
        ...(device_type && { device_type }),
        ...(basis && { basis }),
        ...(frequency && { frequency }),
      }

      const [cycles, total] = await Promise.all([
        this.prisma.maintenanceCycle.findMany({
          where,
          skip,
          take: limit,
          //  orderBy: { createdAt: 'desc' },
        }),
        this.prisma.maintenanceCycle.count({ where }),
      ])

      return new PaginationResponseDto<MaintenanceCycleDto>(
        cycles,
        total,
        page,
        limit,
        200,
        cycles.length > 0 ? 'Lấy danh sách chu kỳ bảo trì thành công' : 'Không tìm thấy chu kỳ bảo trì nào',
      )
    } catch (error) {
      this.logger.error('Error retrieving maintenance cycles:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách chu kỳ bảo trì',
      })
    }
  }

  async findById(cycle_id: string): Promise<ApiResponse<MaintenanceCycleDto>> {
    try {
      const cycle = await this.prisma.maintenanceCycle.findUnique({
        where: { cycle_id },
      })

      if (!cycle) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy chu kỳ bảo trì',
        })
      }

      return new ApiResponse<MaintenanceCycleDto>(
        true,
        'Lấy thông tin chu kỳ bảo trì thành công',
        cycle
      )
    } catch (error) {
      this.logger.error(`Error retrieving maintenance cycle with ID ${cycle_id}:`, error)
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Lỗi khi lấy thông tin chu kỳ bảo trì',
      })
    }
  }

  async update(cycle_id: string, updateDto: UpdateMaintenanceCycleDto): Promise<ApiResponse<MaintenanceCycleDto>> {
    try {
      // Get the current cycle data before updating
      const currentCycle = await this.prisma.maintenanceCycle.findUnique({
        where: { cycle_id },
      });

      if (!currentCycle) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy chu kỳ bảo trì',
        });
      }

      // Extract updated_by and reason if they exist in the updateDto
      const { updated_by, reason, ...updateData } = updateDto as any;

      // Save the current state to history
      await this.prisma.maintenanceCycleHistory.create({
        data: {
          cycle_id: currentCycle.cycle_id,
          frequency: currentCycle.frequency,
          basis: currentCycle.basis,
          device_type: currentCycle.device_type,
          updated_by: updated_by || null,
          reason: reason || null
        },
      });

      // Update the cycle
      const updatedCycle = await this.prisma.maintenanceCycle.update({
        where: { cycle_id },
        data: updateData,
      });

      return new ApiResponse<MaintenanceCycleDto>(
        true,
        'Cập nhật chu kỳ bảo trì thành công',
        updatedCycle
      );
    } catch (error) {
      this.logger.error(`Error updating maintenance cycle with ID ${cycle_id}:`, error)
      throw new RpcException({
        statusCode: error.code === 'P2025' ? 404 : 500,
        message: error.code === 'P2025' ? 'Không tìm thấy chu kỳ bảo trì' : 'Lỗi khi cập nhật chu kỳ bảo trì',
      })
    }
  }

  async delete(cycle_id: string): Promise<ApiResponse<MaintenanceCycleDto>> {
    try {
      // Delete all history records for the cycle 
      const history = await this.prisma.maintenanceCycleHistory.findFirst({
        where: { cycle_id }
      })
      if (history) {
        await this.prisma.maintenanceCycleHistory.deleteMany({
          where: { cycle_id },
        })
      }

      const cycle = await this.prisma.maintenanceCycle.delete({
        where: { cycle_id },
      })

      return new ApiResponse<MaintenanceCycleDto>(
        true,
        'Xóa chu kỳ bảo trì thành công',
        cycle
      )
    } catch (error) {
      this.logger.error(`Error deleting maintenance cycle with ID ${cycle_id}:`, error)
      throw new RpcException({
        statusCode: error.code === 'P2025' ? 404 : 500,
        message: error.code === 'P2025' ? 'Không tìm thấy chu kỳ bảo trì' : 'Lỗi khi xóa chu kỳ bảo trì',
      })
    }
  }

  async getHistory(cycle_id: string): Promise<ApiResponse<MaintenanceCycleHistoryDto[]>> {
    try {
      const cycle = await this.prisma.maintenanceCycle.findUnique({
        where: { cycle_id },
        include: {
          history: true
        }
      })

      if (!cycle) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy chu kỳ bảo trì',
        })
      }

      return new ApiResponse<MaintenanceCycleHistoryDto[]>(
        true,
        'Lấy lịch sử chu kỳ bảo trì thành công',
        cycle.history
      )
    } catch (error) {
      this.logger.error(`Error retrieving history for maintenance cycle with ID ${cycle_id}:`, error)
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Lỗi khi lấy lịch sử chu kỳ bảo trì',
      })
    }
  }
} 