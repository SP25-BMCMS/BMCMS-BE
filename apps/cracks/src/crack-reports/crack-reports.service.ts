import { TASKASSIGNMENT_PATTERN } from '@app/contracts/taskAssigment/taskAssigment.patterns';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { AssignmentStatus, Status } from '@prisma/client-Task';
import { $Enums, Prisma, CrackReport } from '@prisma/client-cracks';
import { ApiResponse } from 'libs/contracts/src/ApiReponse/api-response';
import { TASKS_PATTERN } from 'libs/contracts/src/tasks/task.patterns';
import { BUILDINGDETAIL_PATTERN } from 'libs/contracts/src/BuildingDetails/buildingdetails.patterns';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { S3UploaderService, UploadResult } from '../crack-details/s3-uploader.service';
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns';

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';


@Injectable()
export class CrackReportsService {
  private s3: S3Client
  private bucketName: string
  constructor(
    private prismaService: PrismaService,
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy,
    @Inject(BUILDINGS_CLIENT) private readonly buildingClient: ClientProxy,
    private configService: ConfigService,
    private s3UploaderService: S3UploaderService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    })
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET')
  }

  async getPreSignedUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    })

    return getSignedUrl(this.s3, command, { expiresIn: 3600 }) // URL có hạn trong 1 giờ
  }

  async getAllCrackReports(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    severityFilter?: $Enums.Severity,
  ): Promise<{
    data: CrackReport[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }> {
    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      throw new RpcException(
        new ApiResponse(false, 'Invalid page or limit parameters!'),
      )
    }
    if (
      severityFilter &&
      !Object.values($Enums.Severity).includes(severityFilter)
    ) {
      throw new RpcException(
        new ApiResponse(false, 'Invalid severity filter parameter!'),
      )
    }

    const skip = (page - 1) * limit

    // Xây dựng điều kiện truy vấn
    const where: Prisma.CrackReportWhereInput = {}

    // Nếu có tham số tìm kiếm, xử lý tìm kiếm
    if (search) {
      where.OR = [{ description: { contains: search, mode: 'insensitive' } }]
    }

    // Filter theo mức độ nghiêm trọng (severity) của CrackDetails
    if (severityFilter) {
      where.crackDetails = {
        some: {
          severity: severityFilter,
        },
      }
    }

    try {
      const crackReports = await this.prismaService.crackReport.findMany({
        where,
        include: { crackDetails: true }, // Bao gồm thông tin chi tiết vết nứt
        skip,
        take: limit,
      })

      const totalCount = await this.prismaService.crackReport.count({ where })

      return {
        data: crackReports,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        },
      }
    } catch (error) {
      new ApiResponse(false, 'Error when getting crack report!', error)
    }
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15) // Tạo ID duy nhất cho correlationId
  }

  async addCrackReport(dto: AddCrackReportDto, userId: string) {
    try {
      return await this.prismaService.$transaction(async (prisma) => {
        // Check if buildingDetailId exists
        if (dto.buildingDetailId) {
          try {
            const buildingDetail = await firstValueFrom(
              this.buildingClient
                .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId: dto.buildingDetailId })
                .pipe(
                  catchError((error) => {
                    console.error('Error checking building detail:', error);
                    throw new RpcException({
                      status: 404,
                      message: 'buildingDetailId not found with id = ' + dto.buildingDetailId
                    });
                  }),
                ),
            );

            if (buildingDetail.statusCode === 404) {
              throw new RpcException({
                status: 404,
                message: 'buildingDetailId not found with id = ' + dto.buildingDetailId
              });
            }
          } catch (error) {
            if (error instanceof RpcException) {
              throw error;
            }
            throw new RpcException({
              status: 404,
              message: 'buildingDetailId not found with id = ' + dto.buildingDetailId
            });
          }
        }

        // 🔹 Validate position format if isPrivatesAsset is false
        if (!dto.isPrivatesAsset) {
          const positionParts = dto.position?.split('/')
          if (!positionParts || positionParts.length !== 4) {
            throw new RpcException({
              status: 400,
              message: `Invalid position format. Expected format: "area/building/floor/direction". Provided: ${dto.position}`
            });

          }
          const [area, building, floor, direction] = positionParts
          console.log(
            `Position details - Area: ${area}, Building: ${building}, Floor: ${floor}, Direction: ${direction}`,
          )
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
            verifiedBy: '123123123',
          },
        })

        console.log('🚀 CrackReport created:', newCrackReport)

        // 🔹 2. Create CrackDetails if isPrivatesAsset is true
        let newCrackDetails = [];
        if (dto.files?.length > 0) {
          // Upload files to S3
          const uploadResult = await this.s3UploaderService.uploadFiles(dto.files);

          if (!uploadResult.isSuccess) {
            throw new RpcException({
              status: 400,
              message: uploadResult.message
            });
          }

          // Create crack details with uploaded URLs
          newCrackDetails = await Promise.all(
            (uploadResult.data as UploadResult).uploadImage.map((photoUrl, index) => {
              return prisma.crackDetail.create({
                data: {
                  crackReportId: newCrackReport.crackReportId,
                  photoUrl: photoUrl,
                  severity: $Enums.Severity.Medium, // Hardcode severity as Medium
                  aiDetectionUrl: (uploadResult.data as UploadResult).annotatedImage[index],
                },
              })
            }),
          )
        }

        console.log('🚀 CrackDetails created:', newCrackDetails)

        return new ApiResponse(
          true,
          'Crack Report and Crack Details created successfully',
          [{ crackReport: newCrackReport, crackDetails: newCrackDetails }],
        )
      })
    } catch (error) {
      console.error('🔥 Error in CrackReportService:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            status: 400,
            message: 'Duplicate data error'
          });

        }
      }

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        status: 500,
        message: 'System error, please try again later'
      });

    }
  }

  async findById(crackReportId: string) {
    const report = await this.prismaService.crackReport.findUnique({
      where: { crackReportId },
    })
    if (!report) {
      throw new RpcException(
        new ApiResponse(false, 'Crack Report không tồn tại'),
      )
    }
    return new ApiResponse(true, 'Crack Report đã tìm thấy', [report])
  }

  async updateCrackReport(crackReportId: string, dto: UpdateCrackReportDto) {
    const existingReport = await this.prismaService.crackReport.findUnique({
      where: { crackReportId },
    })
    if (!existingReport) {
      throw new RpcException(
        new ApiResponse(false, 'Crack Report không tồn tại'),
      )
    }

    try {
      const updatedReport = await this.prismaService.crackReport.update({
        where: { crackReportId },
        data: { ...dto },
      })
      return new ApiResponse(true, 'Crack Report đã được cập nhật thành công', [
        updatedReport,
      ])
    } catch (error) {
      throw new RpcException(new ApiResponse(false, 'Dữ liệu không hợp lệ'))
    }
  }

  async deleteCrackReport(crackReportId: string) {
    try {
      // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
      return await this.prismaService.$transaction(async (prisma) => {
        // Kiểm tra báo cáo tồn tại
        const existingReport = await prisma.crackReport.findUnique({
          where: { crackReportId },
          include: { crackDetails: true }
        })

        if (!existingReport) {
          throw new RpcException(
            new ApiResponse(false, 'Crack Report không tồn tại'),
          )
        }

        // Lấy tất cả ID của CrackDetail
        const crackDetailIds = existingReport.crackDetails.map(detail => detail.crackDetailsId);


        // Xóa tất cả CrackSegment liên quan đến các CrackDetail của báo cáo này
        if (crackDetailIds.length > 0) {
          await prisma.crackSegment.deleteMany({
            where: {
              crackDetailsId: { in: crackDetailIds }
            }
          });
        }

        // Xóa tất cả CrackDetail của báo cáo
        await prisma.crackDetail.deleteMany({
          where: { crackReportId }
        });

        // Xóa CrackReport
        await prisma.crackReport.delete({
          where: { crackReportId }
        });

        return new ApiResponse(true, 'Crack Report và các dữ liệu liên quan đã được xóa thành công', {
          crackReportId,
          crackDetailIds,
          deletedSegmentsCount: crackDetailIds.length > 0 ? crackDetailIds.length : 0,
          deletedDetailsCount: existingReport.crackDetails.length
        });
      });
    } catch (error) {
      console.error('Lỗi khi xóa Crack Report:', error);
      throw new RpcException(
        new ApiResponse(false, 'Lỗi hệ thống khi xóa Crack Report. Vui lòng thử lại sau.')
      );
    }
  }

  async updateCrackReportStatus(crackReportId: string, managerId: string) {
    try {
      return await this.prismaService.$transaction(async (prisma) => {
        const existingReport = await prisma.crackReport.findUnique({
          where: { crackReportId },
        })

        if (!existingReport) {
          return new ApiResponse(false, 'Crack Report không tồn tại')
        }

        const updatedReport = await prisma.crackReport.update({
          where: { crackReportId },
          data: {
            status: $Enums.ReportStatus.InProgress,
            verifiedBy: managerId,
          },
        })

        let createTaskResponse
        let createTaskAssignmentResponse

        try {
          // Create task first
          createTaskResponse = await firstValueFrom(
            this.taskClient
              .send(TASKS_PATTERN.CREATE, {
                description: `Xử lý báo cáo nứt ${crackReportId}`,
                status: Status.Assigned,
                crack_id: crackReportId,
                schedule_job_id: '',
              })
              .pipe(
                catchError((error) => {
                  console.error('Task creation error:', error)
                  throw new RpcException(
                    new ApiResponse(false, 'Không thể tạo task')
                  )
                })
              )
          )

          // Check if task creation was successful and task_id exists
          if (!createTaskResponse || !createTaskResponse.data || !createTaskResponse.data.task_id) {
            throw new RpcException(
              new ApiResponse(false, 'Task được tạo nhưng không trả về task_id hợp lệ')
            )
          }

          // Then use the ASSIGN_TO_EMPLOYEE pattern instead of CREATE
          createTaskAssignmentResponse = await firstValueFrom(
            this.taskClient
              .send(TASKASSIGNMENT_PATTERN.ASSIGN_TO_EMPLOYEE, {
                taskId: createTaskResponse.data.task_id,
                employeeId: managerId,
                description: `Phân công xử lý báo cáo nứt ${crackReportId}`,
                status: AssignmentStatus.Pending,
              })
              .pipe(
                catchError((error) => {
                  console.error('Task assignment error:', error)
                  throw new RpcException(
                    new ApiResponse(false, 'Không thể tạo phân công task')
                  )
                }),
              ),
          )
        } catch (taskError) {
          console.error('Task creation/assignment error:', taskError)
          // We should throw the error to rollback the transaction
          throw taskError
        }

        return new ApiResponse(
          true,
          'Crack Report đã được cập nhật và Task đã được tạo',
          {
            crackReport: updatedReport,
            task: createTaskResponse,
            taskAssignment: createTaskAssignmentResponse,
          },
        )
      })
    } catch (error) {
      console.error('🔥 Lỗi trong updateCrackReportStatus:', error)

      if (error instanceof RpcException) {
        throw error
      }

      throw new RpcException(
        new ApiResponse(false, 'Lỗi hệ thống, vui lòng thử lại sau')
      )
    }
  }
}
