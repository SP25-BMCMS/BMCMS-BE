import { Injectable, Logger, Inject } from '@nestjs/common';
import { Payload, RpcException, ClientProxy } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client-building';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateLocationDetailDto } from 'libs/contracts/src/LocationDetails/create-locationdetails.dto';
import { UpdateLocationDetailDto } from 'libs/contracts/src/LocationDetails/update.locationdetails';
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto';
import { INSPECTIONS_PATTERN } from '@app/contracts/inspections/inspection.patterns';

@Injectable()
export class LocationDetailService {
  private prisma = new PrismaClient();
  private readonly logger = new Logger(LocationDetailService.name);

  constructor(@Inject('TASK_CLIENT') private readonly taskClient: ClientProxy) {}

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
        include: {
          crackRecords: true,
          buildingDetail: true,
        },
      });

      if (!locationDetail) {
        throw new RpcException({
          statusCode: 404,
          message: 'LocationDetail not found',
        });
      }

      // Nếu có inspection_id, lấy thông tin inspection
      if (locationDetail.inspection_id) {
        try {
          // Gọi đến TASK_CLIENT để lấy chi tiết inspection
          const inspectionResponse = await this.taskClient.send(
            INSPECTIONS_PATTERN.GET_DETAILS,
            locationDetail.inspection_id
          ).toPromise();

          // Thêm dữ liệu inspection vào response
          return {
            statusCode: 200,
            message: 'LocationDetail retrieved successfully',
            data: {
              ...locationDetail,
              inspection: inspectionResponse && inspectionResponse.data ? inspectionResponse.data : null
            },
          };
        } catch (inspectionError) {
          this.logger.error(`Error fetching inspection data: ${inspectionError.message}`);
          // Vẫn trả về location detail dù không lấy được inspection
          return {
            statusCode: 200,
            message: 'LocationDetail retrieved successfully (inspection data unavailable)',
            data: locationDetail,
          };
        }
      }

      return {
        statusCode: 200,
        message: 'LocationDetail retrieved successfully',
        data: locationDetail,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      
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

  /**
   * Find LocationDetail by inspection_id and roomNumber
   * Used to prevent duplicate records
   */
  async findByInspectionIdAndRoomNumber(inspection_id: string, roomNumber: string): Promise<any> {
    try {
      const locationDetail = await this.prisma.locationDetail.findFirst({
        where: {
          inspection_id,
          roomNumber
        }
      });

      return locationDetail;
    } catch (error) {
      console.error('Error finding LocationDetail by inspection_id and roomNumber:', error);
      return null;
    }
  }
}
