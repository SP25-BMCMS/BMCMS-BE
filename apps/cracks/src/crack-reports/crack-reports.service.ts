import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrackReportDto } from 'libs/contracts/src/cracks/crack-report.dto';
import { Prisma } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { ApiResponse } from 'libs/contracts/src/ApiReponse/api-response';

@Injectable()
export class CrackReportsService {
  constructor(private prismService: PrismaService) { }

  async getAllCrackReports() {
    return  await this.prismService.crackReport.findMany();
  }

  async addCrackReport(dto: AddCrackReportDto) {
    try {
      const newReport = await this.prismService.crackReport.create({ data: { ...dto } });
      return new ApiResponse(true, 'Crack Report đã được tạo thành công', [newReport]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new RpcException(new ApiResponse(false, 'Dữ liệu bị trùng lặp'));
      }
      throw new RpcException(new ApiResponse(false, 'Lỗi hệ thống, vui lòng thử lại sau'));
    }
  }

  async findById(crackId: string) {
    const report = await this.prismService.crackReport.findUnique({ where: { crackId } });
    if (!report) {
      throw new RpcException(new ApiResponse(false, 'Crack Report không tồn tại'));
    }
    return new ApiResponse(true, 'Crack Report đã tìm thấy', [report]);
  }

  async updateCrackReport(crackId: string, dto: UpdateCrackReportDto) {
    const existingReport = await this.prismService.crackReport.findUnique({ where: { crackId } });
    if (!existingReport) {
      throw new RpcException(new ApiResponse(false, 'Crack Report không tồn tại'));
    }

    try {
      const updatedReport = await this.prismService.crackReport.update({
        where: { crackId },
        data: { ...dto },
      });
      return new ApiResponse(true, 'Crack Report đã được cập nhật thành công', [updatedReport]);
    } catch (error) {
      throw new RpcException(new ApiResponse(false, 'Dữ liệu không hợp lệ'));
    }
  }

  async deleteCrackReport(crackId: string) {
    const existingReport = await this.prismService.crackReport.findUnique({ where: { crackId } });
    if (!existingReport) {
      throw new RpcException(new ApiResponse(false, 'Crack Report không tồn tại'));
    }

    await this.prismService.crackReport.delete({ where: { crackId } });
    return new ApiResponse(true, 'Crack Report đã được xóa thành công');
  }

  // async findById(crackId: string) {
  //   try {
  //     const report = await this.prismService.crackReport.findUnique({
  //       where: { crackId },
  //     });
  //
  //     if (!report) {
  //       throw new RpcException({ status: 404, message: 'Crack Report không tồn tại' });
  //     }
  //
  //     return report;
  //   } catch (error) {
  //     throw new RpcException({ status: 500, message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  //   }
  // }
  //
  // async updateCrackReport(crackId: string, dto: UpdateCrackReportDto) {
  //   const existingReport = await this.prismService.crackReport.findUnique({
  //     where: { crackId },
  //   });
  //
  //   if (!existingReport) {
  //     throw new RpcException({ message: 'Crack Report không tồn tại' });
  //   }
  //
  //   try {
  //     return await this.prismService.crackReport.update({
  //       where: { crackId },
  //       data: { ...dto }, // Chỉ cập nhật các field hợp lệ
  //     });
  //   } catch (error) {
  //     if (error instanceof Prisma.PrismaClientValidationError) {
  //       throw new RpcException({ message: 'Dữ liệu không hợp lệ' });
  //     }
  //
  //     throw new RpcException({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  //   }
  // }
  //
  // async deleteCrackReport(crackId: string) {
  //   try {
  //     return await this.prismService
  //       .crackReport.delete({
  //         where: { crackId },
  //       });
  //   } catch (error) {
  //     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
  //       throw new RpcException({ status: 404, message: 'Crack Report không tồn tại' });
  //     }
  //     throw new RpcException({ status: 500, message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  //   }
  // }
  //
  // async addCrackReport(dto: AddCrackReportDto) {
  //   try {
  //     return await this.prismService.crackReport.create({
  //       data: {
  //         buildingDetailId: dto.buildingDetailId,
  //         photoUrl: dto.photoUrl,
  //         status: dto.status,
  //         reportedBy: dto.reportedBy,
  //       },
  //     });
  //   } catch (error) {
  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       if (error.code === 'P2002') {
  //         throw new RpcException({ status: 400, message: 'Dữ liệu bị trùng lặp' });
  //       }
  //     }
  //     throw new RpcException({ status: 500, message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  //   }
  // }
}
