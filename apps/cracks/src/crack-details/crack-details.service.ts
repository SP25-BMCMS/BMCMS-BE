import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UpdateCrackDetailDto } from 'libs/contracts/src/cracks/update-crack-detail.dto';
import { ApiResponse } from '../../../../libs/contracts/src/ApiReponse/api-response';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrackDetailsService {
  constructor(private prisma: PrismaService) {}

  async getAllCrackDetails() {
    return await this.prisma.crackDetail.findMany();
  }
  async findById(crackDetailsId: string) {
    const detail = await this.prisma.crackDetail.findUnique({
      where: { crackDetailsId },
    });
    if (!detail) {
      throw new RpcException(
        new ApiResponse(false, 'Crack Detail không tồn tại'),
      );
    }
    return new ApiResponse(true, 'Crack Detail đã tìm thấy', [detail]);
  }

  async updateCrackDetail(id: string, dto: UpdateCrackDetailDto) {
    const exists = await this.prisma.crackDetail.findUnique({
      where: { crackDetailsId: id },
    });
    if (!exists)
      throw new RpcException(
        new ApiResponse(false, 'Crack Detail không tồn tại'),
      );

    const data = await this.prisma.crackDetail.update({
      where: { crackDetailsId: id },
      data: { ...dto },
    });
    return new ApiResponse(true, 'Crack Detail đã được cập nhật', [data]);
  }

  async deleteCrackDetail(id: string) {
    const exists = await this.prisma.crackDetail.findUnique({
      where: { crackDetailsId: id },
    });
    if (!exists)
      throw new RpcException(
        new ApiResponse(false, 'Crack Detail không tồn tại'),
      );

    await this.prisma.crackDetail.delete({ where: { crackDetailsId: id } });
    return new ApiResponse(true, 'Crack Detail đã được xóa');
  }
}
