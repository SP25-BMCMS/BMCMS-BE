import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateCrackRecordDto } from '@app/contracts/CrackRecord/create-CrackRecord.dto';
import { UpdateCrackRecordDto } from '@app/contracts/CrackRecord/update-CrackRecord.dto';
import { CrackRecordDto } from '@app/contracts/CrackRecord/CrackRecord.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';
import { PrismaService } from 'apps/buildings/prisma/prisma.service';

@Injectable()
export class CrackRecordService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCrackRecordDto): Promise<ApiResponse<CrackRecordDto>> {
    try {
      const crackRecord = await this.prisma.crackRecord.create({
        data: createDto,
      });

      return new ApiResponse<CrackRecordDto>(
        true,
        'Crack record created successfully',
        crackRecord,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: `Failed to create crack record: ${error.message}`,
      });
    }
  }

  async findAll(
    page?: number,
    limit?: number,
    search?: string,
  ): Promise<ApiResponse<CrackRecordDto[]>> {
    const skip = page ? (page - 1) * (limit || 10) : 0;
    const take = limit || 10;

    const whereSearch = search
      ? {
          OR: [
            { description: { contains: search, mode: 'insensitive' as const } },
            { locationDetailId: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [crackRecords, total] = await Promise.all([
      this.prisma.crackRecord.findMany({
        skip,
        take,
        where: whereSearch,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.crackRecord.count({ where: whereSearch }),
    ]);

    return {
      isSuccess: true,
      data: crackRecords,
      message: 'Crack records retrieved successfully',
    };
  }

  async findOne(crackRecordId: string): Promise<ApiResponse<CrackRecordDto>> {
    try {
      const crackRecord = await this.prisma.crackRecord.findUnique({
        where: { crackRecordId },
      });

      if (!crackRecord) {
        throw new RpcException({
          statusCode: 404,
          message: 'Crack record not found',
        });
      }

      return new ApiResponse<CrackRecordDto>(
        true,
        'Crack record retrieved successfully',
        crackRecord,
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: `Failed to retrieve crack record: ${error.message}`,
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
        'Crack record updated successfully',
        crackRecord,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: `Failed to update crack record: ${error.message}`,
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
        'Crack record deleted successfully',
        crackRecord,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: `Failed to delete crack record: ${error.message}`,
      });
    }
  }

  async findByLocation(locationDetailId: string): Promise<ApiResponse<CrackRecordDto[]>> {
    try {
      const crackRecords = await this.prisma.crackRecord.findMany({
        where: { locationDetailId },
      });

      return new ApiResponse<CrackRecordDto[]>(
        true,
        'Crack records retrieved successfully',
        crackRecords,
      );
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: `Failed to retrieve crack records: ${error.message}`,
      });
    }
  }
} 