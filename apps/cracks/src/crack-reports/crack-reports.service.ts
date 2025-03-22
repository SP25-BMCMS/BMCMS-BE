import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { $Enums, Prisma } from '@prisma/client-cracks';
import { RpcException } from '@nestjs/microservices';
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { ApiResponse } from 'libs/contracts/src/ApiReponse/api-response';
import { ClientProxy } from '@nestjs/microservices';
import { TASKS_PATTERN } from 'libs/contracts/src/tasks/task.patterns';
import { Status } from '@prisma/client-Task';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BadRequestException } from '@nestjs/common';
import { TASKASSIGNMENT_PATTERN } from '@app/contracts/taskAssigment/taskAssigment.patterns';

@Injectable()
export class CrackReportsService {
  constructor(private prismService: PrismaService,
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy
  ) { }

  async getAllCrackReports() {
    return await this.prismService.crackReport.findMany();
  }

  async addCrackReport(dto: AddCrackReportDto, userId: string) {
    try {
      return await this.prismService.$transaction(async (prisma) => {
        // 🔹 Validate position format if isPrivatesAsset is false
        if (!dto.isPrivatesAsset) {
          const positionParts = dto.position?.split('/');
          if (!positionParts || positionParts.length !== 4) {
            throw new RpcException(
              new ApiResponse(
                false,
                `Invalid position format. Expected format: "area/building/floor/direction". Provided: ${dto.position}`
              )
            );
          }
          const [area, building, floor, direction] = positionParts;
          console.log(`Position details - Area: ${area}, Building: ${building}, Floor: ${floor}, Direction: ${direction}`);
        }

        // 🔹 1. Create CrackReport
        const newCrackReport = await prisma.crackReport.create({
          data: {
            buildingDetailId: dto.buildingDetailId,
            description: dto.description,
            isPrivatesAsset: dto.isPrivatesAsset,
            position: dto.isPrivatesAsset ? null : dto.position,
            status: dto.status ?? $Enums.ReportStatus.Pending,
            reportedBy: userId,
            verifiedBy: "123123123",
          },
        });

        console.log('🚀 CrackReport created:', newCrackReport);

        // 🔹 2. Create CrackDetails if isPrivatesAsset is true
        let newCrackDetails = [];
        if (dto.crackDetails?.length > 0) {
          newCrackDetails = await Promise.all(
            dto.crackDetails.map(async (detail) => {
              return prisma.crackDetail.create({
                data: {
                  crackReportId: newCrackReport.crackReportId,
                  photoUrl: detail.photoUrl,
                  severity: detail.severity ?? $Enums.Severity.Unknown,
                  aiDetectionUrl: detail.aiDetectionUrl ?? detail.photoUrl,
                },
              });
            })
          );
        }

        console.log('🚀 CrackDetails created:', newCrackDetails);

        return new ApiResponse(true, 'Crack Report and Crack Details created successfully', [
          { crackReport: newCrackReport, crackDetails: newCrackDetails },
        ]);
      });
    } catch (error) {
      console.error('🔥 Error in CrackReportService:', error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            status: 400,
            message: 'Duplicate data error',
          });
        }
      }

      throw new RpcException({
        status: 500,
        message: 'System error, please try again later',
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

  async updateCrackReportStatus(crackReportId: string, managerId: string) {
    try {
      return await this.prismService.$transaction(async (prisma) => {
        const existingReport = await prisma.crackReport.findUnique({
          where: { crackReportId },
        });

        if (!existingReport) {
          throw new RpcException(
            new ApiResponse(false, 'Crack Report không tồn tại')
          );
        }

        const updatedReport = await prisma.crackReport.update({
          where: { crackReportId },
          data: {
            status: $Enums.ReportStatus.InProgress,
            verifiedBy: managerId,
          },
        });

        let createTaskResponse;
        let createTaskAssignmentResponse;

        try {
          createTaskResponse = await firstValueFrom(
            this.taskClient.send(TASKS_PATTERN.CREATE, {
              description: `Xử lý báo cáo nứt ${crackReportId}`,
              status: Status.Assigned,
              crack_id: crackReportId,
              schedule_job_id: '',
            }).pipe(
              catchError(error => {
                console.error('Task creation error:', error);
                throw new RpcException(
                  new ApiResponse(false, 'Không thể tạo task')
                );
              })
            )
          );

          // Uncomment and modify task assignment if needed
          createTaskAssignmentResponse = await firstValueFrom(
            this.taskClient.send(TASKASSIGNMENT_PATTERN.CREATE, {
              task_id: createTaskResponse.task_id,
              employee_id: managerId,
              description: `Phân công xử lý báo cáo nứt ${crackReportId}`,
              status: Status.Assigned
            }).pipe(
              catchError(error => {
                console.error('Task assignment error:', error);
                throw new RpcException(
                  new ApiResponse(false, 'Không thể tạo phân công task')
                );
              })
            )
          );
        } catch (taskError) {
          console.error('Task creation/assignment error:', taskError);
          // Optionally, you can choose to continue or rollback
        }

        return new ApiResponse(
          true,
          'Crack Report đã được cập nhật và Task đã được tạo',
          {
            crackReport: updatedReport,
            task: createTaskResponse,
            taskAssignment: createTaskAssignmentResponse
          }
        );
      });
    } catch (error) {
      console.error('🔥 Lỗi trong updateCrackReportStatus:', error);
      throw new RpcException(
        new ApiResponse(false, 'Lỗi hệ thống, vui lòng thử lại sau')
      );
    }
  }
}
