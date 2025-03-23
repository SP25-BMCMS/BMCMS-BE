import { TASKASSIGNMENT_PATTERN } from '@app/contracts/taskAssigment/taskAssigment.patterns'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientProxy, RpcException } from '@nestjs/microservices'
import { Status } from '@prisma/client-Task'
import { $Enums, Prisma } from '@prisma/client-cracks'
import { ApiResponse } from 'libs/contracts/src/ApiReponse/api-response'
import { TASKS_PATTERN } from 'libs/contracts/src/tasks/task.patterns'
import { firstValueFrom } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto'
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class CrackReportsService {
  private s3: S3Client
  private bucketName: string
  constructor(private prismaService: PrismaService,
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy,
    private configService: ConfigService
  ) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
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
    severityFilter?: string
  ) {
    const skip = (page - 1) * limit
  
    // Điều kiện tìm kiếm và lọc
    const where: any = {}
  
    if (search) {
      where.crackDetails = {
        some: {
          description: { contains: search, mode: 'insensitive' }
        }
      }
    }
  
    if (severityFilter) {
      where.severity = severityFilter
    }
  
    // Lấy danh sách báo cáo vết nứt
    const crackReports = await this.prismaService.crackReport.findMany({
      where,
      include: { crackDetails: true },
      skip,
      take: limit
    })
  
    // Chuyển đổi photoUrl thành Pre-Signed URL
    for (const report of crackReports) {
      for (const detail of report.crackDetails) {
        if (detail.photoUrl) {
          detail.photoUrl = await this.getPreSignedUrl(detail.photoUrl)
        }
      }
    }
  
    // Đếm tổng số bản ghi (cho frontend hiển thị số trang)
    const totalCount = await this.prismaService.crackReport.count({ where })
  
    return {
      data: crackReports,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  }
  

  async addCrackReport(dto: AddCrackReportDto, userId: string) {
    try {
      return await this.prismaService.$transaction(async (prisma) => {
        // 🔹 1. Tạo CrackReport trước
        const newCrackReport = await prisma.crackReport.create({
          data: {
            buildingDetailId: dto.buildingDetailId,
            description: dto.description,
            status: dto.status ?? $Enums.ReportStatus.Pending, // Mặc định Reported
            reportedBy: userId, // ✅ Luôn có giá trị
            verifiedBy: '123123', // ✅ Nếu null thì Prisma nhận null
          }
        })

        console.log('🚀 CrackReport đã tạo:', newCrackReport)

        // 🔹 2. Nếu có CrackDetails, tạo từng cái bằng `create()`
        let newCrackDetails = []
        if (dto.crackDetails?.length > 0) {
          newCrackDetails = await Promise.all(
            dto.crackDetails.map(async (detail) => {
              return prisma.crackDetail.create({
                data: {
                  crackReportId: newCrackReport.crackReportId, // Liên kết CrackReport
                  photoUrl: detail.photoUrl,
                  severity: detail.severity ?? $Enums.Severity.Unknown, // Mặc định Unknown
                  aiDetectionUrl: detail.aiDetectionUrl ?? detail.photoUrl,
                },
              })
            })
          )
        }

        console.log('🚀 CrackDetails đã tạo:', newCrackDetails)

        return new ApiResponse(true, 'Crack Report và Crack Details đã được tạo thành công', [
          { crackReport: newCrackReport, crackDetails: newCrackDetails },
        ])
      })
    } catch (error) {
      console.error('🔥 Lỗi trong CrackReportService:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            status: 400,
            message: 'Dữ liệu bị trùng lặp',
          })
        }
      }

      throw new RpcException({
        status: 500,
        message: 'Lỗi hệ thống, vui lòng thử lại sau',
      })
    }
  }


  async findById(crackReportId: string) {
    const report = await this.prismaService.crackReport.findUnique({ where: { crackReportId } })
    if (!report) {
      throw new RpcException(new ApiResponse(false, 'Crack Report không tồn tại'))
    }
    return new ApiResponse(true, 'Crack Report đã tìm thấy', [report])
  }

  async updateCrackReport(crackReportId: string, dto: UpdateCrackReportDto) {
    const existingReport = await this.prismaService.crackReport.findUnique({ where: { crackReportId } })
    if (!existingReport) {
      throw new RpcException(new ApiResponse(false, 'Crack Report không tồn tại'))
    }

    try {
      const updatedReport = await this.prismaService.crackReport.update({
        where: { crackReportId },
        data: { ...dto },
      })
      return new ApiResponse(true, 'Crack Report đã được cập nhật thành công', [updatedReport])
    } catch (error) {
      throw new RpcException(new ApiResponse(false, 'Dữ liệu không hợp lệ'))
    }
  }

  async deleteCrackReport(crackReportId: string) {
    const existingReport = await this.prismaService.crackReport.findUnique({ where: { crackReportId } })
    if (!existingReport) {
      throw new RpcException(new ApiResponse(false, 'Crack Report không tồn tại'))
    }

    await this.prismaService.crackReport.delete({ where: { crackReportId } })
    return new ApiResponse(true, 'Crack Report đã được xóa thành công')
  }

  async updateCrackReportStatus(crackReportId: string, managerId: string) {
    try {
      return await this.prismaService.$transaction(async (prisma) => {
        const existingReport = await prisma.crackReport.findUnique({
          where: { crackReportId },
        })

        if (!existingReport) {
          throw new RpcException(
            new ApiResponse(false, 'Crack Report không tồn tại')
          )
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
          createTaskResponse = await firstValueFrom(
            this.taskClient.send(TASKS_PATTERN.CREATE, {
              description: `Xử lý báo cáo nứt ${crackReportId}`,
              status: Status.Assigned,
              crack_id: crackReportId,
              schedule_job_id: '',
            }).pipe(
              catchError(error => {
                console.error('Task creation error:', error)
                throw new RpcException(
                  new ApiResponse(false, 'Không thể tạo task')
                )
              })
            )
          )

          // Uncomment and modify task assignment if needed
          createTaskAssignmentResponse = await firstValueFrom(
            this.taskClient.send(TASKASSIGNMENT_PATTERN.CREATE, {
              task_id: createTaskResponse.task_id,
              employee_id: managerId,
              description: `Phân công xử lý báo cáo nứt ${crackReportId}`,
              status: Status.Assigned
            }).pipe(
              catchError(error => {
                console.error('Task assignment error:', error)
                throw new RpcException(
                  new ApiResponse(false, 'Không thể tạo phân công task')
                )
              })
            )
          )
        } catch (taskError) {
          console.error('Task creation/assignment error:', taskError)
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
        )
      })
    } catch (error) {
      console.error('🔥 Lỗi trong updateCrackReportStatus:', error)
      throw new RpcException(
        new ApiResponse(false, 'Lỗi hệ thống, vui lòng thử lại sau')
      )
    }
  }
}
