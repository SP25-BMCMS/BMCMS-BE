import { Injectable } from '@nestjs/common'
import { Payload, RpcException } from '@nestjs/microservices'
import { PrismaClient } from '@prisma/client-building'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { CreateBuildingDetailDto } from 'libs/contracts/src/BuildingDetails/create-buildingdetails.dto'
import { UpdateBuildingDetailDto } from 'libs/contracts/src/BuildingDetails/update.buildingdetails'
import { PrismaService } from '../../users/prisma/prisma.service'
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'

@Injectable()
export class BuildingDetailsService {
  private prisma = new PrismaClient();

  constructor(private prismaService: PrismaService) { }

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
      })
      return {
        statusCode: 201,
        message: 'Tạo chi tiết tòa nhà thành công',
        data: newBuildingDetail,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Tạo chi tiết tòa nhà thất bại',
      })
    }
  }

  async getAllBuildingDetails(
    paginationParams: PaginationParams = { page: 1, limit: 10 },
  ): Promise<PaginationResponseDto<any>> {
    try {
      const page = Number(paginationParams.page) || 1
      const limit = Number(paginationParams.limit) || 10
      const skip = (page - 1) * limit

      // Get total count
      const total = await this.prisma.buildingDetail.count()

      // Get paginated building details
      const buildingDetails = await this.prisma.buildingDetail.findMany({
        skip,
        take: limit,
        include: {
          building: true,
          locationDetails: true,
          device: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const responseData = {
        statusCode: 200,
        message: 'Danh sách chi tiết tòa nhà',
        data: buildingDetails,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }

      return responseData
    } catch (error) {
      console.error('Error in getAllBuildingDetails:', error)
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
      }

      return errorData
    }
  }

  async getBuildingDetailById(buildingDetailId: string) {
    try {
      console.log(`Fetching building detail with ID: ${buildingDetailId}`)

      const buildingDetail = await this.prisma.buildingDetail.findUnique({
        where: { buildingDetailId },
        include: {
          building: {
            include: {
              area: true,

            }

          },
          //locationDetails: true
          device: true,
        }
      })

      if (!buildingDetail) {
        console.log(`Building detail not found for ID: ${buildingDetailId}`)
        return {
          statusCode: 404,
          message: 'Không tìm thấy chi tiết tòa nhà',
        }
      }

      console.log(`Building detail found for ID: ${buildingDetailId}`)
      console.log('Building information:', {
        hasBuildingInfo: !!buildingDetail.building,
        buildingId: buildingDetail.building?.buildingId,
        hasAreaInfo: !!buildingDetail.building?.area,
        areaId: buildingDetail.building?.area?.areaId,
        // hasLocationDetails: Array.isArray(buildingDetail.locationDetails) ? buildingDetail.locationDetails.length : 0
      })

      return {
        statusCode: 200,
        message: 'Lấy thông tin chi tiết tòa nhà thành công',
        data: buildingDetail,
      }
    } catch (error) {
      console.error(`Error retrieving building detail ${buildingDetailId}:`, error)
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy thông tin chi tiết tòa nhà',
      })
    }
  }

  async updateBuildingDetail(
    buildingDetailId: string,
    updateBuildingDetailDto: UpdateBuildingDetailDto,
  ) {
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
      })
      return {
        statusCode: 200,
        message: 'Cập nhật chi tiết tòa nhà thành công',
        data: updatedBuildingDetail,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Cập nhật chi tiết tòa nhà thất bại',
      })
    }
  }

  async deleteBuildingDetail(buildingDetailId: string) {
    try {
      // First check if the building detail exists
      const buildingDetail = await this.prisma.buildingDetail.findUnique({
        where: { buildingDetailId },
        include: {
          locationDetails: true,
          device: true
        }
      });

      if (!buildingDetail) {
        return {
          statusCode: 404,
          message: 'Không tìm thấy chi tiết tòa nhà với ID đã cung cấp',
        }
      }

      // Start a transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx) => {
        // 1. Delete all CrackRecords related to LocationDetails
        for (const location of buildingDetail.locationDetails) {
          await tx.crackRecord.deleteMany({
            where: { locationDetailId: location.locationDetailId }
          });
        }

        // 2. Delete all TechnicalRecords and MaintenanceHistory related to Devices
        for (const device of buildingDetail.device) {
          await tx.technicalRecord.deleteMany({
            where: { device_id: device.device_id }
          });

          await tx.maintenanceHistory.deleteMany({
            where: { device_id: device.device_id }
          });
        }

        // 3. Delete all LocationDetails related to BuildingDetail
        await tx.locationDetail.deleteMany({
          where: { buildingDetailId }
        });

        // 4. Delete all Devices related to BuildingDetail
        await tx.device.deleteMany({
          where: { buildingDetailId }
        });

        // 5. Finally delete the BuildingDetail itself
        const deletedBuildingDetail = await tx.buildingDetail.delete({
          where: { buildingDetailId }
        });

        return {
          statusCode: 200,
          message: 'Xóa chi tiết tòa nhà và tất cả dữ liệu liên quan thành công',
          data: deletedBuildingDetail,
        }
      });
    } catch (error) {
      console.error('Error during building detail deletion:', error);

      if (error instanceof PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        if (error.code === 'P2025') {
          return {
            statusCode: 404,
            message: 'Không tìm thấy chi tiết tòa nhà',
          }
        }
        if (error.code === 'P2023') {
          return {
            statusCode: 400,
            message: 'Định dạng ID không hợp lệ',
          }
        }
      }

      throw new RpcException({
        statusCode: 500,
        message: `Xóa chi tiết tòa nhà thất bại: ${error.message}`,
      })
    }
  }

  async checkBuildingDetailExists(buildingDetailId: string) {
    try {
      const buildingDetail = await this.prisma.buildingDetail.findUnique({
        where: { buildingDetailId },
        include: {
          building: {
            include: {
              area: true
            }
          },
          locationDetails: true
        }
      })

      if (!buildingDetail) {
        return {
          statusCode: 404,
          message: 'Không tìm thấy chi tiết tòa nhà',
          exists: false
        }
      }

      return {
        statusCode: 200,
        message: 'Chi tiết tòa nhà tồn tại',
        exists: true,
        data: buildingDetail,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi kiểm tra chi tiết tòa nhà',
      })
    }
  }
}
