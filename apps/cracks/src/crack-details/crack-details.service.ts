import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RpcException } from '@nestjs/microservices';
import { CreateCrackDetailDto } from 'libs/contracts/src/cracks/create-crack-detail.dto';
import { UpdateCrackDetailDto } from 'libs/contracts/src/cracks/update-crack-detail.dto';
import { ApiResponse } from '../../../../libs/contracts/src/ApiReponse/api-response';
import { Prisma } from '@prisma/client';

@Injectable()
export class CrackDetailsService {
  constructor(private prisma: PrismaService) {}

  async getAllCrackDetails() {
    return  await this.prisma.crackDetail.findMany();
  }
  async findById(crackDetailsId: string) {
    const detail = await this.prisma.crackDetail.findUnique({ where: { crackDetailsId } });
    if (!detail) {
      throw new RpcException(new ApiResponse(false, 'Crack Detail không tồn tại'));
    }
    return new ApiResponse(true, 'Crack Detail đã tìm thấy', [detail]);
  }

  async addCrackDetail(dto: CreateCrackDetailDto) {
    try {
      const crackReportExists = await this.prisma.crackReport.findUnique({
        where: { crackId: dto.crackId },
      });
      if (!crackReportExists) {
        throw new RpcException(new ApiResponse(false, 'CrackID not found'));
      }
      const newCrackDetail  = await this.prisma.crackDetail.create({ data: {
        crackId: dto.crackId,
        photoUrl: dto.photoUrl,
        description: dto.description,
        status: dto.status,
        severity: dto.severity,
        reportedBy: dto.reportedBy,
        verifiedBy: dto.verifiedBy, }
      });
      return new ApiResponse(true, 'Crack Detail đã được tạo thành công', [newCrackDetail]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            status: 400,
            message: 'Dữ liệu bị trùng lặp',
          });
        }
      }
      throw new RpcException({
        status: 500,
        message: 'Lỗi hệ thống, vui lòng thử lại sau',
      });
    }
  }

  async updateCrackDetail(id: string, dto: UpdateCrackDetailDto) {
    const exists = await this.prisma.crackDetail.findUnique({ where: { crackDetailsId: id } });
    if (!exists) throw new RpcException(new ApiResponse(false, 'Crack Detail không tồn tại'));

    const data = await this.prisma.crackDetail.update({ where: { crackDetailsId: id }, data: { ...dto } });
    return new ApiResponse(true, 'Crack Detail đã được cập nhật', [data]);
  }

  async deleteCrackDetail(id: string) {
    const exists = await this.prisma.crackDetail.findUnique({ where: { crackDetailsId: id } });
    if (!exists) throw new RpcException(new ApiResponse(false, 'Crack Detail không tồn tại'));

    await this.prisma.crackDetail.delete({ where: { crackDetailsId: id } });
    return new ApiResponse(true, 'Crack Detail đã được xóa');
  }
}
