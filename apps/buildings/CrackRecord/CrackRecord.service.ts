import { Injectable, Logger, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateCrackRecordDto } from '@app/contracts/CrackRecord/create-CrackRecord.dto';
import { UpdateCrackRecordDto } from '@app/contracts/CrackRecord/update-CrackRecord.dto';
import { CrackRecordDto } from '@app/contracts/CrackRecord/CrackRecord.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';
import { PrismaService } from 'apps/buildings/prisma/prisma.service';
import { PaginationParams, PaginationResponseDto } from '@app/contracts/Pagination/pagination.dto';
import { ClientProxy } from '@nestjs/microservices';
import { INSPECTIONS_PATTERN } from '@app/contracts/inspections/inspection.patterns';

@Injectable()
export class CrackRecordService {
  private readonly logger = new Logger(CrackRecordService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('TASK_CLIENT') private readonly taskClient: ClientProxy
  ) { }

  async create(createDto: CreateCrackRecordDto): Promise<ApiResponse<CrackRecordDto>> {
    try {
      // Kiểm tra xem đã có CrackRecord với locationDetailId này chưa
      // const existingRecord = await this.prisma.crackRecord.findFirst({
      //   where: { locationDetailId: createDto.locationDetailId }
      // });

      // if (existingRecord) {
      //   throw new RpcException({
      //     statusCode: 400,
      //     message: `Cannot create crack record: A record already exists for this location (locationDetailId: ${createDto.locationDetailId})`,
      //   });
      // }

      const crackRecord = await this.prisma.crackRecord.create({
        data: createDto,
      });

      return new ApiResponse<CrackRecordDto>(
        true,
        'Tạo bản ghi vết nứt thành công',
        crackRecord,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: `Không thể tạo bản ghi vết nứt: ${error.message}`,
      });
    }
  }

  async findAll(paginationParams?: PaginationParams): Promise<PaginationResponseDto<CrackRecordDto>> {
    try {
      const page = Math.max(1, paginationParams?.page || 1);
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10));
      const skip = (page - 1) * limit;

      const [crackRecords, total] = await Promise.all([
        this.prisma.crackRecord.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.crackRecord.count(),
      ]);

      return new PaginationResponseDto<CrackRecordDto>(
        crackRecords,
        total,
        page,
        limit,
        200,
        crackRecords.length > 0 ? 'Lấy danh sách bản ghi vết nứt thành công' : 'Không tìm thấy bản ghi vết nứt nào',
      );
    } catch (error) {
      this.logger.error('Error retrieving crack records:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách bản ghi vết nứt',
      });
    }
  }

  async findOne(crackRecordId: string): Promise<ApiResponse<CrackRecordDto>> {
    try {
      const crackRecord = await this.prisma.crackRecord.findUnique({
        where: { crackRecordId },
      });

      if (!crackRecord) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy bản ghi vết nứt',
        });
      }

      return new ApiResponse<CrackRecordDto>(
        true,
        'Lấy thông tin bản ghi vết nứt thành công',
        crackRecord,
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: `Lỗi khi lấy thông tin bản ghi vết nứt: ${error.message}`,
      });
    }
  }

  async update(
    crackRecordId: string,
    updateDto: UpdateCrackRecordDto,
  ): Promise<ApiResponse<CrackRecordDto>> {
    try {
      const crackRecord = await this.prisma.crackRecord.update({
        where: { crackRecordId },
        data: updateDto,
      });

      return new ApiResponse<CrackRecordDto>(
        true,
        'Cập nhật bản ghi vết nứt thành công',
        crackRecord,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: `Không thể cập nhật bản ghi vết nứt: ${error.message}`,
      });
    }
  }

  async remove(crackRecordId: string): Promise<ApiResponse<CrackRecordDto>> {
    try {
      const crackRecord = await this.prisma.crackRecord.delete({
        where: { crackRecordId },
      });

      return new ApiResponse<CrackRecordDto>(
        true,
        'Xóa bản ghi vết nứt thành công',
        crackRecord,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: `Không thể xóa bản ghi vết nứt: ${error.message}`,
      });
    }
  }

  async getByBuildingDetailId(
    buildingDetailId: string,
    paginationParams?: PaginationParams
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    try {
      this.logger.log(`Getting crack records for building detail: ${buildingDetailId}`);

      const page = Math.max(1, paginationParams?.page || 1);
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10));
      const skip = (page - 1) * limit;

      const [crackRecords, total] = await Promise.all([
        this.prisma.crackRecord.findMany({
          where: { locationDetail: { buildingDetailId: buildingDetailId } },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.crackRecord.count({ where: { locationDetail: { buildingDetailId: buildingDetailId } } }),
      ]);

      return new PaginationResponseDto<CrackRecordDto>(
        crackRecords,
        total,
        page,
        limit,
        200,
        crackRecords.length > 0 ? 'Lấy danh sách bản ghi vết nứt thành công' : 'Không tìm thấy bản ghi vết nứt nào',
      );
    } catch (error) {
      this.logger.error(`Error getting crack records for building detail ${buildingDetailId}:`, error);
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách bản ghi vết nứt',
      });
    }
  }

  async getByInspectionId(
    inspectionId: string,
    paginationParams?: PaginationParams
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    try {
      this.logger.log(`Getting crack records for inspection: ${inspectionId}`);

      // Tìm tất cả locationDetail dựa trên inspection_id
      const locationDetails = await this.prisma.locationDetail.findMany({
        where: { inspection_id: inspectionId }
      });

      if (!locationDetails || locationDetails.length === 0) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy chi tiết vị trí cho lần báo cáo này',
        });
      }

      // này là tạo mảng chứa locationDetialId từ mảng locationDetails
      const locationDetailIds = locationDetails.map(location => location.locationDetailId);

      const page = Math.max(1, paginationParams?.page || 1);
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10));
      const skip = (page - 1) * limit;

      // Tìm tất cả crackRecord dựa trên danh sách locationDetailId
      const [crackRecords, total] = await Promise.all([
        this.prisma.crackRecord.findMany({
          where: {
            locationDetailId: {
              // này là tìm tất cả crackRecord dựa trên danh sách locationDetailId
              in: locationDetailIds
            }
          },
          skip,
          include: {
            locationDetail: {
              include: {
                buildingDetail: true,
              },
            },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.crackRecord.count({
          where: {
            locationDetailId: {
              in: locationDetailIds
            }
          }
        }),
      ]);

      return new PaginationResponseDto<CrackRecordDto>(
        crackRecords,
        total,
        page,
        limit,
        200,
        crackRecords.length > 0 ? 'Lấy danh sách bản ghi vết nứt thành công' : 'Không tìm thấy bản ghi vết nứt nào',
      );
    } catch (error) {
      this.logger.error(`Error getting crack records for inspection ${inspectionId}:`, error);
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Lỗi khi lấy danh sách bản ghi vết nứt',
      });
    }
  }

  async getByLocationDetailId(
    locationDetailId: string,
    paginationParams?: PaginationParams
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    try {
      this.logger.log(`Getting crack records for location detail: ${locationDetailId}`);

      const page = Math.max(1, paginationParams?.page || 1);
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10));
      const skip = (page - 1) * limit;

      const [crackRecords, total] = await Promise.all([
        this.prisma.crackRecord.findMany({
          where: { locationDetailId },
          skip,
          take: limit,
          include: {
            locationDetail: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.crackRecord.count({ where: { locationDetailId } }),
      ]);

      return new PaginationResponseDto<CrackRecordDto>(
        crackRecords,
        total,
        page,
        limit,
        200,
        crackRecords.length > 0 ? 'Lấy danh sách bản ghi vết nứt thành công' : 'Không tìm thấy bản ghi vết nứt nào',
      );
    } catch (error) {
      this.logger.error(`Error getting crack records for location detail ${locationDetailId}:`, error);
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách bản ghi vết nứt',
      });
    }
  }
} 