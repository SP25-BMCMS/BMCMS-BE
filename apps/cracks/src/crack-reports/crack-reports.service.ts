import {  Injectable,  } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { $Enums, Prisma } from '@prisma/client-cracks';
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

  async addCrackReport(dto: AddCrackReportDto, userId: string) {
    try {
      return await this.prismService.$transaction(async (prisma) => {
        // 🔹 1. Tạo CrackReport trước
        const newCrackReport = await prisma.crackReport.create({
          data: {
            buildingDetailId: dto.buildingDetailId,
            description: dto.description,
            status: dto.status ?? $Enums.ReportStatus.Reported, // Mặc định Reported
            reportedBy: userId, // ✅ Luôn có giá trị
            verifiedBy: '123123', // ✅ Nếu null thì Prisma nhận null
          }
        });

        console.log('🚀 CrackReport đã tạo:', newCrackReport);

        // 🔹 2. Nếu có CrackDetails, tạo từng cái bằng `create()`
        let newCrackDetails = [];
        if (dto.crackDetails?.length > 0) {
          newCrackDetails = await Promise.all(
            dto.crackDetails.map(async (detail) => {
              return prisma.crackDetail.create({
                data: {
                  crackReportId: newCrackReport.crackReportId, // Liên kết CrackReport
                  photoUrl: detail.photoUrl,
                  status: detail.status ?? $Enums.CrackStatus.InProgress, // Mặc định InProgress
                  severity: detail.severity ?? $Enums.Severity.Unknown, // Mặc định Unknown
                  aiDetectionUrl: detail.aiDetectionUrl ?? detail.photoUrl,
                },
              });
            })
          );
        }

        console.log('🚀 CrackDetails đã tạo:', newCrackDetails);

        return new ApiResponse(true, 'Crack Report và Crack Details đã được tạo thành công', [
          { crackReport: newCrackReport, crackDetails: newCrackDetails },
        ]);
      });
    } catch (error) {
      console.error('🔥 Lỗi trong CrackReportService:', error);

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


  async findById(crackReportId: string) {
    const report = await this.prismService.crackReport.findUnique({ where: { crackReportId } });
    if (!report) {
      throw new RpcException(new ApiResponse(false, 'Crack Report không tồn tại'));
    }
    return new ApiResponse(true, 'Crack Report đã tìm thấy', [report]);
  }

  async updateCrackReport(crackReportId: string, dto: UpdateCrackReportDto) {
    const existingReport = await this.prismService.crackReport.findUnique({ where: { crackReportId } });
    if (!existingReport) {
      throw new RpcException(new ApiResponse(false, 'Crack Report không tồn tại'));
    }

    try {
      const updatedReport = await this.prismService.crackReport.update({
        where: { crackReportId },
        data: { ...dto },
      });
      return new ApiResponse(true, 'Crack Report đã được cập nhật thành công', [updatedReport]);
    } catch (error) {
      throw new RpcException(new ApiResponse(false, 'Dữ liệu không hợp lệ'));
    }
  }

  async deleteCrackReport(crackReportId: string) {
    const existingReport = await this.prismService.crackReport.findUnique({ where: { crackReportId } });
    if (!existingReport) {
      throw new RpcException(new ApiResponse(false, 'Crack Report không tồn tại'));
    }

    await this.prismService.crackReport.delete({ where: { crackReportId } });
    return new ApiResponse(true, 'Crack Report đã được xóa thành công');
  }

}
