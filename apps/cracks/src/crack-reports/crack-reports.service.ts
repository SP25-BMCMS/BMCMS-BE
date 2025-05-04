import { TASKASSIGNMENT_PATTERN } from '@app/contracts/taskAssigment/taskAssigment.patterns'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientProxy, ClientGrpc, RpcException } from '@nestjs/microservices'
import { AssignmentStatus, Status } from '@prisma/client-Task'
import { $Enums, Prisma, CrackReport } from '@prisma/client-cracks'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { TASKS_PATTERN } from 'libs/contracts/src/tasks/task.patterns'
import { BUILDINGDETAIL_PATTERN } from 'libs/contracts/src/BuildingDetails/buildingdetails.patterns'
import { AREAS_PATTERN } from 'libs/contracts/src/Areas/Areas.patterns'
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns'
import { firstValueFrom, Observable, of } from 'rxjs'
import { catchError, timeout, retry } from 'rxjs/operators'
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto'
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { S3UploaderService, UploadResult } from '../crack-details/s3-uploader.service'
import { PrismaClient } from '@prisma/client-Task'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { NotificationType } from '@app/contracts/notifications/notification.dto'
import { Logger } from '@nestjs/common'

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'
const USERS_CLIENT = 'USERS_CLIENT'

interface UserService {
  Test(data: { message: string }): Observable<any>
  checkStaffAreaMatch(data: { staffId: string; crackReportId: string }): Observable<{
    isSuccess: boolean
    message: string
    isMatch: boolean
  }>
  GetUserInfo(data: { userId: string }): Observable<any>
}

@Injectable()
export class CrackReportsService {
  private s3: S3Client
  private bucketName: string
  private userService: UserService
  private prisma = new PrismaClient();
  private readonly logger = new Logger(CrackReportsService.name)
  constructor(
    private prismaService: PrismaService,
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy,
    @Inject(BUILDINGS_CLIENT) private readonly buildingClient: ClientProxy,
    @Inject(USERS_CLIENT) private readonly usersClient: ClientGrpc,
    @Inject('NOTIFICATION_CLIENT') private readonly notificationsClient: ClientProxy,
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
    this.userService = this.usersClient.getService<UserService>('UserService')
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
    data: any[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }> {
    const startTime = performance.now()
    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      throw new RpcException(
        new ApiResponse(false, 'Tham số trang hoặc giới hạn không hợp lệ!'),
      )
    }
    if (
      severityFilter &&
      !Object.values($Enums.Severity).includes(severityFilter)
    ) {
      throw new RpcException(
        new ApiResponse(false, 'Tham số lọc mức độ nghiêm trọng không hợp lệ!'),
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
      // Đo thời gian query database
      const dbQueryStartTime = performance.now()
      const [crackReports, totalCount] = await Promise.all([
        this.prismaService.crackReport.findMany({
          where,
          include: { crackDetails: true },
          skip,
          take: limit,
        }),
        this.prismaService.crackReport.count({ where })
      ])
      const dbQueryTime = performance.now() - dbQueryStartTime
      console.log(`Database query time: ${dbQueryTime.toFixed(2)}ms`)

      // Get usernames for all reporters
      const reporterIds = [...new Set(crackReports.map(report => report.reportedBy))]
      const verifierIds = [...new Set(crackReports.map(report => report.verifiedBy))]

      const userMap = new Map()

      // Đo thời gian lấy user info
      const userInfoStartTime = performance.now()
      await Promise.all([
        ...verifierIds.map(async (userId) => {
          try {
            if (userId) {
              const userResponse = await firstValueFrom(
                this.userService.GetUserInfo({ userId }).pipe(
                  catchError(error => {
                    console.error(`Error fetching user data for ID ${userId}:`, error)
                    return of(null)
                  })
                )
              )

              if (userResponse) {
                userMap.set(userId, {
                  userId: userResponse.userId,
                  username: userResponse.username
                })
              }
            }
          } catch (error) {
            console.error(`Failed to get user data for ID ${userId}:`, error)
          }
        }),
        ...reporterIds.map(async (userId) => {
          try {
            if (userId) {
              const userResponse = await firstValueFrom(
                this.userService.GetUserInfo({ userId }).pipe(
                  catchError(error => {
                    console.error(`Error fetching user data for ID ${userId}:`, error)
                    return of(null)
                  })
                )
              )

              if (userResponse) {
                userMap.set(userId, {
                  userId: userResponse.userId,
                  username: userResponse.username
                })
              }
            }
          } catch (error) {
            console.error(`Failed to get user data for ID ${userId}:`, error)
          }
        })
      ])
      const userInfoTime = performance.now() - userInfoStartTime
      console.log(`User info fetch time: ${userInfoTime.toFixed(2)}ms`)

      // Đo thời gian lấy presigned URLs
      const presignedUrlStartTime = performance.now()

      // --------------------------------------------------------------------------------------------------------------------------------------

      // Collect all unique buildingDetailIds from the crack reports
      const buildingDetailIds = [...new Set(crackReports.map(report => report.buildingDetailId))]
      const buildingDetailsMap = new Map()

      // Fetch all building details in parallel
      if (buildingDetailIds.length > 0) {
        console.log(`Fetching building details for ${buildingDetailIds.length} unique buildingDetailIds`)

        await Promise.all(
          buildingDetailIds.map(async (buildingDetailId) => {
            if (buildingDetailId) {
              try {
                const buildingDetailResponse = await firstValueFrom(
                  this.buildingClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId }).pipe(
                    catchError(error => {
                      console.error(`Error fetching building detail for ID ${buildingDetailId}:`, error)
                      return of(null)
                    })
                  )
                )

                if (buildingDetailResponse && buildingDetailResponse.data) {
                  buildingDetailsMap.set(buildingDetailId, {
                    buildingId: buildingDetailResponse.data.buildingId,
                    name: buildingDetailResponse.data.name
                  })
                }
              } catch (error) {
                console.error(`Failed to get building detail for ID ${buildingDetailId}:`, error)
              }
            }
          })
        )
        console.log(`Successfully fetched building details for ${buildingDetailsMap.size} out of ${buildingDetailIds.length} building details`)
      }
      // --------------------------------------------------------------------------------------------------------------------------------------

      const enhancedDetails = await Promise.all(crackReports.map(async report => {
        const userData = userMap.get(report.reportedBy)
        const verifierData = userMap.get(report.verifiedBy)
        // ------------------------------------------------------------------------------------------------

        // Get building details from map
        // console.log(`Building details map:`, buildingDetailsMap);

        // console.log(`Building details map:`, buildingDetailsMap.get(report.buildingDetailId));

        const buildingDetail = buildingDetailsMap.get(report.buildingDetailId)
        // console.log(`Building detail for report ${report.crackReportId}:`, buildingDetail.name);
        // console.log(`Building detail for report ${report.crackReportId}:`, buildingDetail.buildingId);

        // ------------------------------------------------------------------------------------------------

        return {
          ...report,
          reportedBy: {
            userId: report.reportedBy,
            username: userData?.username || 'Unknown'
          },
          verifiedBy: {
            userId: report.verifiedBy,
            username: verifierData?.username || 'Unknown'
          },
          buildingId: buildingDetail?.buildingId || null,
          buildingName: buildingDetail?.name || null,
          crackDetails: await Promise.all(report.crackDetails.map(async detail => ({
            ...detail,
            photoUrl: detail.photoUrl ? await this.getPreSignedUrl(this.extractFileKey(detail.photoUrl)) : null,
            aiDetectionUrl: detail.aiDetectionUrl ? await this.getPreSignedUrl(this.extractFileKey(detail.aiDetectionUrl)) : null,
          })))
        }
      }))

      const presignedUrlTime = performance.now() - presignedUrlStartTime
      console.log(`Presigned URL generation time: ${presignedUrlTime.toFixed(2)}ms`)

      const totalTime = performance.now() - startTime
      console.log(`Total execution time: ${totalTime.toFixed(2)}ms`)

      return {
        data: enhancedDetails,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        },
      }
    } catch (error) {
      console.error('Error getting crack reports:', error)
      throw new RpcException(
        new ApiResponse(false, 'Lỗi khi lấy báo cáo vết nứt!', error)
      )
    }
  }

  extractFileKey(urlString: string): string {
    try {
      // Extract the file key from the full URL
      const url = new URL(urlString)

      // Assuming the file key starts after the domain name in the path
      return url.pathname.substring(1) // Remove leading "/"

    } catch (error) {
      console.error('Invalid URL format:', urlString)
      throw new Error('Failed to extract file key from URL')
    }
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15) // Generate unique ID for correlationId
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
                    console.error('Error checking building detail:', error)
                    throw new RpcException({
                      status: 404,
                      message: 'Không tìm thấy thông tin chi tiết tòa nhà với id = ' + dto.buildingDetailId
                    })
                  }),
                ),
            )

            if (buildingDetail.statusCode === 404) {
              throw new RpcException({
                status: 404,
                message: 'Không tìm thấy thông tin chi tiết tòa nhà với id = ' + dto.buildingDetailId
              })
            }
          } catch (error) {
            if (error instanceof RpcException) {
              throw error
            }
            throw new RpcException({
              status: 404,
              message: 'Không tìm thấy thông tin chi tiết tòa nhà với id = ' + dto.buildingDetailId
            })
          }
        }

        // Validate position format if isPrivatesAsset is false
        if (!dto.isPrivatesAsset) {
          const positionParts = dto.position?.split('/')
          if (!positionParts || positionParts.length !== 4) {
            throw new RpcException({
              status: 400,
              message: `Định dạng vị trí không hợp lệ. Định dạng yêu cầu: "khu vực/tòa nhà/tầng/hướng". Đã cung cấp: ${dto.position}`
            })
          }
          const [area, building, floor, direction] = positionParts
          console.log(
            `Position details - Area: ${area}, Building: ${building}, Floor: ${floor}, Direction: ${direction}`,
          )
        }

        // 1. Create CrackReport
        const newCrackReport = await prisma.crackReport.create({
          data: {
            buildingDetailId: dto.buildingDetailId,
            description: dto.description,
            isPrivatesAsset: dto.isPrivatesAsset,
            position: dto.isPrivatesAsset ? dto.position : dto.position,
            status: dto.status ?? $Enums.ReportStatus.Pending,
            reportedBy: userId,
            verifiedBy: '123123123',
          },
        })

        console.log('🚀 CrackReport created:', newCrackReport)

        // 2. Create CrackDetails trước để lấy crackDetailId
        let newCrackDetails = []
        if (dto.files?.length > 0) {
          // Bước 1: Tạo crackDetail trước (chỉ có crackReportId, chưa có photoUrl)
          newCrackDetails = await Promise.all(
            dto.files.map(() =>
              prisma.crackDetail.create({
                data: {
                  crackReportId: newCrackReport.crackReportId,
                  photoUrl: '',
                  severity: $Enums.Severity.Unknown,
                  aiDetectionUrl: '',
                },
              })
            )
          )

          // Bước 2: Chuẩn bị files kèm crackDetailId để upload
          const filesWithIds = dto.files.map((file, idx) => ({
            file,
            crackDetailId: newCrackDetails[idx].crackDetailsId,
          }))

          // Bước 3: Upload files lên S3
          const uploadResult = await this.s3UploaderService.uploadFiles(filesWithIds)

          if (!uploadResult.isSuccess) {
            throw new RpcException({
              status: 400,
              message: uploadResult.message
            })
          }

          // Bước 4: Cập nhật lại crackDetail với photoUrl và aiDetectionUrl
          newCrackDetails = await Promise.all(
            newCrackDetails.map(async (detail, idx) => {
              return prisma.crackDetail.update({
                where: { crackDetailsId: detail.crackDetailsId },
                data: {
                  photoUrl: (uploadResult.data as UploadResult).uploadImage[idx],
                  aiDetectionUrl: (uploadResult.data as UploadResult).annotatedImage[idx],
                },
              })
            })
          )
        }

        console.log('🚀 CrackDetails created:', newCrackDetails)

        // Send notification to managers about the new crack report
        try {
          let buildingName = "Tòa nhà không xác định"
          let managerId = null
          let retryCount = 0
          const maxRetries = 3

          if (!dto.buildingDetailId) {
            this.logger.error(`Missing buildingDetailId in crack report. Cannot send notification to manager.`)
            throw new Error('Thiếu buildingDetailId cho thông báo')
          }

          // Lấy buildingDetail với retry logic
          while (!managerId && retryCount < maxRetries) {
            try {
              this.logger.log(`Attempt ${retryCount + 1} to get building info for buildingDetailId: ${dto.buildingDetailId}`)

              // Step 1: Get buildingDetail to get buildingId
              const buildingDetailResponse = await firstValueFrom(
                this.buildingClient
                  .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId: dto.buildingDetailId })
                  .pipe(
                    timeout(10000),
                    retry(2),
                    catchError(error => {
                      this.logger.error(`Error getting building detail: ${error.message}`)
                      return of(null)
                    })
                  )
              )

              if (!buildingDetailResponse || !buildingDetailResponse.data) {
                throw new Error(`Failed to get building detail data for ID: ${dto.buildingDetailId}`)
              }

              buildingName = buildingDetailResponse.data.name || "Unknown Building"
              const buildingId = buildingDetailResponse.data.buildingId

              if (!buildingId) {
                throw new Error(`Building detail ${dto.buildingDetailId} has no associated buildingId`)
              }

              this.logger.log(`Found buildingId: ${buildingId} for buildingDetail: ${dto.buildingDetailId}`)

              // Step 2: Get building info to get managerId
              const buildingResponse = await firstValueFrom(
                this.buildingClient
                  .send(BUILDINGS_PATTERN.GET_BY_ID, { buildingId: buildingId })
                  .pipe(
                    timeout(10000),
                    retry(2),
                    catchError(error => {
                      this.logger.error(`Error getting building info: ${error.message}`)
                      return of(null)
                    })
                  )
              )

              if (!buildingResponse || !buildingResponse.data) {
                throw new Error(`Failed to get building data for ID: ${buildingId}`)
              }

              // Log full response để xem cấu trúc dữ liệu thực tế
              this.logger.log(`Building response data: ${JSON.stringify(buildingResponse.data)}`)

              // Kiểm tra nhiều tên trường khác nhau
              managerId = buildingResponse.data.managerId ||
                buildingResponse.data.manager_id ||
                buildingResponse.data.managerID ||
                buildingResponse.data.ManagerId ||
                buildingResponse.data.manager?.id ||
                (buildingResponse.data.manager && buildingResponse.data.manager.id)

              if (!managerId && buildingResponse.data) {
                this.logger.log(`Could not find manager ID in keys: ${Object.keys(buildingResponse.data).join(', ')}`)

                // Fallback: If manager not found from field names, try to get from raw response
                if (buildingResponse.data instanceof Object) {
                  for (const key of Object.keys(buildingResponse.data)) {
                    if (key.toLowerCase().includes('manager') && buildingResponse.data[key]) {
                      this.logger.log(`Found potential manager field: ${key} = ${buildingResponse.data[key]}`)
                      if (typeof buildingResponse.data[key] === 'string') {
                        managerId = buildingResponse.data[key]
                        this.logger.log(`Using ${key} as managerId: ${managerId}`)
                        break
                      }
                    }
                  }
                }
              }

              if (!managerId) {
                throw new Error(`Building ${buildingId} has no assigned manager in response`)
              }

              this.logger.log(`Successfully found manager ID: ${managerId} for building: ${buildingId}`)

            } catch (error) {
              retryCount++
              this.logger.error(`Attempt ${retryCount} failed: ${error.message}`)
              if (retryCount < maxRetries) {
                this.logger.log(`Will retry in 1 second...`)
                await new Promise(resolve => setTimeout(resolve, 1000)) // Đợi 1 giây trước khi retry
              }
            }
          }

          // Bắt buộc phải có managerId
          if (!managerId) {
            this.logger.error(`Failed to find manager after ${maxRetries} attempts. Cannot send notification for crack report ${newCrackReport.crackReportId}`)
            throw new Error('Could not determine managerId for notification')
          }

          // Tạo và gửi thông báo - lúc này chắc chắn có managerId
          const notificationData = {
            title: 'Báo cáo vết nứt mới',
            content: `Có báo cáo vết nứt mới tại vị trí "${newCrackReport.position}" ${buildingName ? `tại ${buildingName}` : ''} cần được xử lý.`,
            type: NotificationType.SYSTEM,
            link: `/crack-reports/${newCrackReport.crackReportId}`,
            relatedId: newCrackReport.crackReportId,
            userId: managerId
          }

          this.logger.log(`Sending notification about new crack report to manager: ${managerId}`)
          this.logger.log(`Notification data: ${JSON.stringify(notificationData)}`)

          // Only use emit (event pattern) to send notification
          try {
            // Emit notification WITHOUT waiting for response (no need for firstValueFrom)
            this.notificationsClient.emit(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION, notificationData)
            this.logger.log(`Notification about new crack report emitted successfully`)
          } catch (error) {
            this.logger.error(`Error emitting notification: ${error.message}`)
          }

        } catch (notifyError) {
          this.logger.error(`Error in notification process for new crack report: ${notifyError.message}`)
        }

        return new ApiResponse(
          true,
          'Tạo báo cáo vết nứt và chi tiết thành công',
          [{ crackReport: newCrackReport, crackDetails: newCrackDetails }],
        )
      }, {
        timeout: 30000,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            status: 400,
            message: 'Lỗi dữ liệu trùng lặp'
          })
        }
      }

      if (error instanceof RpcException) {
        throw error
      }

      throw new RpcException({
        status: 500,
        message: 'Lỗi hệ thống, vui lòng thử lại sau'
      })
    }
  }

  async findById(crackReportId: string) {
    const report = await this.prismaService.crackReport.findUnique({
      where: { crackReportId },
      include: {
        crackDetails: true
      }
    })

    if (!report) {
      throw new RpcException(
        new ApiResponse(false, 'Báo cáo vết nứt không tồn tại'),
      )
    }

    try {
      // Try to get user information for reportedBy and verifiedBy
      let reporterInfo = null
      let verifierInfo = null

      try {
        if (report.reportedBy) {
          reporterInfo = await firstValueFrom(
            this.userService.GetUserInfo({ userId: report.reportedBy }).pipe(
              catchError(() => of(null))
            )
          )
        }

        if (report.verifiedBy) {
          verifierInfo = await firstValueFrom(
            this.userService.GetUserInfo({ userId: report.verifiedBy }).pipe(
              catchError(() => of(null))
            )
          )
        }
      } catch (userError) {
        // Continue without user info if there's an error
      }

      // Fetch building details if buildingDetailId exists
      let buildingDetail = null
      if (report.buildingDetailId) {
        try {
          const buildingDetailResponse = await firstValueFrom(
            this.buildingClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId: report.buildingDetailId }).pipe(
              catchError(error => {
                console.error(`Error fetching building detail for ID ${report.buildingDetailId}:`, error)
                return of(null)
              })
            )
          )

          if (buildingDetailResponse && buildingDetailResponse.data) {
            buildingDetail = {
              buildingId: buildingDetailResponse.data.buildingId,
              name: buildingDetailResponse.data.name
            }
          }
        } catch (error) {
          console.error(`Failed to get building detail for ID ${report.buildingDetailId}:`, error)
        }
      }

      // Thêm presigned URL cho từng crackDetail
      // Add presigned URL for each crackDetail
      const enhancedDetails = await Promise.all(
        report.crackDetails.map(async (detail) => ({
          ...detail,
          photoUrl: detail.photoUrl
            ? await this.getPreSignedUrl(this.extractFileKey(detail.photoUrl))
            : null,
          aiDetectionUrl: detail.aiDetectionUrl
            ? await this.getPreSignedUrl(this.extractFileKey(detail.aiDetectionUrl))
            : null
        }))
      )

      const enhancedReport = {
        ...report,
        reportedBy: reporterInfo ? {
          userId: reporterInfo.userId,
          username: reporterInfo.username
        } : {
          userId: report.reportedBy,
          username: 'Unknown'
        },
        verifiedBy: verifierInfo ? {
          userId: verifierInfo.userId,
          username: verifierInfo.username
        } : {
          userId: report.verifiedBy,
          username: 'Unknown'
        },
        buildingId: buildingDetail?.buildingId || null,
        buildingName: buildingDetail?.name || null,
        crackDetails: enhancedDetails // Use processed details
      }

      return new ApiResponse(true, 'Đã tìm thấy báo cáo vết nứt', [enhancedReport])
    } catch (error) {
      // If we encounter an error while enhancing the data, return the original report
      return new ApiResponse(true, 'Crack Report found', [report])
    }
  }

  async updateCrackReport(crackReportId: string, dto: UpdateCrackReportDto) {
    const existingReport = await this.prismaService.crackReport.findUnique({
      where: { crackReportId },
    })
    if (!existingReport) {
      throw new RpcException(
        new ApiResponse(false, 'Báo cáo vết nứt không tồn tại'),
      )
    }

    try {
      const updatedReport = await this.prismaService.crackReport.update({
        where: { crackReportId },
        data: { ...dto },
      })
      return new ApiResponse(true, 'Cập nhật báo cáo vết nứt thành công', [
        updatedReport,
      ])
    } catch (error) {
      throw new RpcException(new ApiResponse(false, 'Dữ liệu không hợp lệ'))
    }
  }

  async deleteCrackReport(crackReportId: string) {
    try {
      // Use transaction to ensure data integrity
      return await this.prismaService.$transaction(async (prisma) => {
        // Check if report exists
        const existingReport = await prisma.crackReport.findUnique({
          where: { crackReportId },
          include: { crackDetails: true }
        })

        if (!existingReport) {
          throw new RpcException(
            new ApiResponse(false, 'Báo cáo vết nứt không tồn tại'),
          )
        }

        // Get all CrackDetail IDs
        const crackDetailIds = existingReport.crackDetails.map(detail => detail.crackDetailsId)

        // Delete all CrackDetails of the report
        await prisma.crackDetail.deleteMany({
          where: { crackReportId }
        })

        // Delete CrackReport
        await prisma.crackReport.delete({
          where: { crackReportId }
        })

        return new ApiResponse(true, 'Đã xóa báo cáo vết nứt và dữ liệu liên quan thành công', {
          crackReportId,
          crackDetailIds,
          deletedSegmentsCount: crackDetailIds.length > 0 ? crackDetailIds.length : 0,
          deletedDetailsCount: existingReport.crackDetails.length
        })
      })
    } catch (error) {
      console.error('Error when deleting Crack Report:', error)
      throw new RpcException(
        new ApiResponse(false, 'Lỗi hệ thống khi xóa báo cáo vết nứt. Vui lòng thử lại sau.')
      )
    }
  }

  async updateCrackReportStatus(crackReportId: string, managerId: string, staffId: string) {
    try {
      // Define all variables outside the transaction to maintain scope
      let existingReport
      let areaMatchResponse
      let updatedReport
      let createTaskResponse
      let createTaskAssignmentResponse
      let buildingDetailInfo = null

      // Start a real database transaction - all operations will be committed or rolled back together
      return await this.prismaService.$transaction(async (prisma) => {
        // Step 1: Find the crack report and validate it exists
        existingReport = await prisma.crackReport.findUnique({
          where: { crackReportId },
        })

        if (!existingReport) {
          throw new RpcException(
            new ApiResponse(false, 'Crack Report does not exist')
          )
        }

        // Step 1.5: Get buildingDetail information if available
        if (existingReport.buildingDetailId) {
          try {
            const buildingDetailResponse = await firstValueFrom(
              this.buildingClient
                .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId: existingReport.buildingDetailId })
                .pipe(
                  timeout(10000),
                  catchError((error) => {
                    console.error('Error fetching building detail:', error)
                    return of(null)
                  })
                )
            )

            buildingDetailInfo = buildingDetailResponse?.data || null
          } catch (error) {
            console.error('Error fetching building detail:', error)
            // Continue even if building detail info cannot be fetched
          }
        }

        // Step 2: Check if staff's area matches the crack report's area
        areaMatchResponse = await firstValueFrom(
          this.userService.checkStaffAreaMatch({ staffId, crackReportId })
        )

        if (!areaMatchResponse.isMatch) {
          throw new RpcException(
            new ApiResponse(false, 'Nhân viên không thuộc khu vực của báo cáo vết nứt này')
          )
        }

        // Create building location text
        const buildingText = buildingDetailInfo ?
          `${buildingDetailInfo.name || buildingDetailInfo.buildingName || ''}` :
          existingReport.position

        // Step 3: Create task first - do this before updating report status
        createTaskResponse = await firstValueFrom(
          this.taskClient
            .send(TASKS_PATTERN.CREATE, {
              title: `Sửa chữa vết nứt tại ${existingReport.position}`,
              description: `Nhiệm vụ kiểm tra và sửa chữa vết nứt. Chi tiết vị trí: ${existingReport.position}${buildingDetailInfo ? ` - Tòa nhà: ${buildingText}` : ''}. Ngày báo cáo: ${new Date(existingReport.createdAt).toLocaleDateString('vi-VN')}`,
              status: Status.Assigned,
              crack_id: crackReportId,
              schedule_job_id: '',
            })
            .pipe(
              timeout(30000),
              retry(3),
              catchError((error) => {
                console.error('Task creation error:', error)
                throw new RpcException(
                  new ApiResponse(false, 'Không thể tạo nhiệm vụ, vui lòng thử lại sau')
                )
              })
            )
        )

        // Check if task creation was successful and task_id exists
        if (!createTaskResponse?.data?.task_id) {
          throw new RpcException(
            new ApiResponse(false, 'Task was created but did not return a valid task_id')
          )
        }

        // Step 4: Create task assignment
        createTaskAssignmentResponse = await firstValueFrom(
          this.taskClient
            .send(TASKASSIGNMENT_PATTERN.ASSIGN_TO_EMPLOYEE, {
              taskId: createTaskResponse.data.task_id,
              employeeId: staffId,
              description: `Phân công xử lý báo cáo vết nứt tại ${existingReport.position}`,
              status: AssignmentStatus.Pending,
            })
            .pipe(
              timeout(30000),
              retry(2),
              catchError((error) => {
                console.error('Task assignment error:', error)
                throw new RpcException(
                  new ApiResponse(false, error.message || 'Cannot create task assignment, please try again later')
                )
              }),
            ),
        )

        // Check task assignment response
        if (createTaskAssignmentResponse?.statusCode === 400) {
          throw new RpcException(
            new ApiResponse(false, createTaskAssignmentResponse.message || 'Error in task assignment')
          )
        }

        // Step 5: Only update the crack report status if everything else succeeded
        updatedReport = await prisma.crackReport.update({
          where: { crackReportId },
          data: {
            status: $Enums.ReportStatus.InProgress,
            verifiedBy: managerId,
          },
        })

        // Return success response with all data
        return new ApiResponse(
          true,
          'Đã cập nhật báo cáo vết nứt và tạo nhiệm vụ thành công',
          {
            crackReport: updatedReport,
            task: createTaskResponse,
            taskAssignment: createTaskAssignmentResponse,
          },
        )
      }, {
        timeout: 30000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      })
    } catch (error) {
      console.error('🔥 Error in updateCrackReportStatus:', error)

      if (error instanceof RpcException) {
        throw error
      }

      throw new RpcException(
        new ApiResponse(false, 'Lỗi hệ thống, vui lòng thử lại sau')
      )
    }
  }

  // Add test method to verify connection with UsersService
  async testUsersServiceConnection() {
    try {
      return await firstValueFrom(
        this.userService.Test({ message: 'Hello from Cracks service!' }),
      )
    } catch (error) {
      console.error('Error testing Users connection:', error)
      return {
        isSuccess: false,
        message: 'Failed to connect to Users service',
        error: error.message,
      }
    }
  }

  /**
   * Get buildingDetailId from task_id
   * Since there's no direct taskId field in CrackReport, we need to query differently
   */
  async getBuildingDetailByTaskId(taskId: string): Promise<ApiResponse<any>> {
    try {
      console.log(`[CrackService] Getting buildingDetailId for taskId: ${taskId}`)

      // Approach 1: If there's a task-to-crackReport relation in another service or table
      // Try to find the crack report ID first from the task service
      console.log(`[CrackService] Calling task service to get crack_id for task: ${taskId}`)
      const crackReportResponse = await firstValueFrom(
        this.taskClient.send(
          { cmd: 'get-crack-id-by-task' },
          { taskId }
        ).pipe(
          timeout(10000),
          catchError(err => {
            console.error(`[CrackService] Error getting crack ID from task service:`, err)
            return of({ isSuccess: false, data: null })
          })
        )
      )

      console.log(`[CrackService] Task service response:`, JSON.stringify(crackReportResponse, null, 2))

      // If we successfully got a crackReportId from the task service
      if (crackReportResponse && crackReportResponse.isSuccess && crackReportResponse.data) {
        const crackReportId = crackReportResponse.data.crackReportId
        console.log(`[CrackService] Found crackReportId: ${crackReportId}`)

        if (!crackReportId) {
          console.log(`[CrackService] crackReportId is null or undefined`)
          return new ApiResponse(true, 'Using default BuildingDetailId - No crackReportId', {
            buildingDetailId: '00000000-0000-0000-0000-000000000000',
            crackReportId: null
          })
        }

        // Now get the crackReport with the crackReportId
        console.log(`[CrackService] Looking up CrackReport with ID: ${crackReportId}`)
        const crackReport = await this.prismaService.crackReport.findUnique({
          where: { crackReportId },
          select: {
            crackReportId: true,
            buildingDetailId: true
          }
        })

        console.log(`[CrackService] CrackReport lookup result:`, crackReport)

        if (crackReport) {
          console.log(`[CrackService] Found buildingDetailId: ${crackReport.buildingDetailId}`)
          return new ApiResponse(true, 'BuildingDetailId retrieved successfully', {
            buildingDetailId: crackReport.buildingDetailId,
            crackReportId: crackReport.crackReportId
          })
        } else {
          console.log(`[CrackService] No CrackReport found with ID: ${crackReportId}`)
        }
      } else {
        console.log(`[CrackService] Failed to get crackReportId from task service`)
      }

      // Try fallback approach - check if we have any CrackReport with this buildingDetailId
      console.log(`[CrackService] Trying fallback approach - looking for any CrackReport`)
      const anyCrackReport = await this.prismaService.crackReport.findFirst({
        select: {
          buildingDetailId: true,
          crackReportId: true
        },
        orderBy: { createdAt: 'desc' }
      })

      if (anyCrackReport) {
        console.log(`[CrackService] Found a recent CrackReport with buildingDetailId: ${anyCrackReport.buildingDetailId}`)
        return new ApiResponse(true, 'Using buildingDetailId from most recent CrackReport', {
          buildingDetailId: anyCrackReport.buildingDetailId,
          crackReportId: anyCrackReport.crackReportId,
          note: 'This is a fallback value, not directly related to the task'
        })
      }

      // Approach 2: If no relation is found, return a hardcoded or default value for now
      // This is a temporary solution until the proper relation is established
      console.log('[CrackService] No relation found, returning default UUID')
      return new ApiResponse(true, 'Using default BuildingDetailId', {
        buildingDetailId: '00000000-0000-0000-0000-000000000000',
        crackReportId: null
      })
    } catch (error) {
      console.error(`[CrackService] Error retrieving BuildingDetailId for taskId ${taskId}:`, error)
      // Return default UUID in case of error
      return new ApiResponse(true, 'Using default BuildingDetailId due to error', {
        buildingDetailId: '00000000-0000-0000-0000-000000000000',
        crackReportId: null
      })
    }
  }

  async getAllCrackReportByUserId(userId: string) {
    try {
      const crackReports = await this.prismaService.crackReport.findMany({
        where: {
          reportedBy: userId
        },
        include: {
          crackDetails: true
        }
      })

      if (!crackReports || crackReports.length === 0) {
        throw new RpcException(
          new ApiResponse(false, 'No crack reports found for this user', {
            crackReports: []
          })
        )
      }

      // Process each crack report to presign image URLs
      const processedReports = await Promise.all(crackReports.map(async (report) => {
        // Process each crack detail to presign image URLs
        const processedDetails = await Promise.all(report.crackDetails.map(async (detail) => {
          return {
            ...detail,
            photoUrl: detail.photoUrl ? await this.getPreSignedUrl(this.extractFileKey(detail.photoUrl)) : null,
            aiDetectionUrl: detail.aiDetectionUrl ? await this.getPreSignedUrl(this.extractFileKey(detail.aiDetectionUrl)) : null
          }
        }))

        return {
          ...report,
          crackDetails: processedDetails
        }
      }))

      return new ApiResponse(true, 'Get all crack report by user id successfully', {
        crackReports: processedReports
      })
    } catch (error) {
      console.error('Error getting all crack report by user id:', error)
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException(
        new ApiResponse(false, 'Error getting all crack report by user id')
      )
    }
  }

  async updateCrackReportForAllStatus(crackReportId: string, dto: UpdateCrackReportDto) {
    try {
      const existingReport = await this.prismaService.crackReport.findUnique({
        where: { crackReportId },
      })

      if (!existingReport) {
        throw new RpcException(
          new ApiResponse(false, 'Báo cáo vết nứt không tồn tại')
        )
      }

      // Save old status for comparison after update
      const oldStatus = existingReport.status

      // Extract suppressNotification flag and remove it from DTO data before updating
      const suppressNotification = dto.suppressNotification

      // Create a new object without suppressNotification to avoid Prisma error
      const prismaUpdateData = { ...dto }
      delete prismaUpdateData.suppressNotification

      // Update crack report with cleaned data
      const updatedReport = await this.prismaService.crackReport.update({
        where: { crackReportId },
        data: {
          ...prismaUpdateData,
          updatedAt: new Date(),
        },
        include: {
          crackDetails: true,
        },
      })

      // Skip notification if suppressNotification is true
      if (suppressNotification) {
        console.log(`Suppressing notification for crack report ${crackReportId} as requested`)
        return new ApiResponse(
          true,
          'Cập nhật báo cáo vết nứt thành công',
          [updatedReport]
        )
      }

      // TEMPORARY: Force notification for testing regardless of status change
      const forceNotification = true

      if (forceNotification || (dto.status && dto.status !== oldStatus)) {
        const validStatus = forceNotification || (dto.status === 'InProgress' || dto.status === 'Rejected' || dto.status === 'Completed')

        if (validStatus) {
          try {
            let title = ''
            let content = ''

            switch (dto.status) {
              case 'InProgress':
                title = 'Báo cáo vết nứt đang được xử lý'
                content = `Báo cáo vết nứt của bạn tại vị trí "${existingReport.position}" đã được nhận và đang được xử lý.`
                break
              case 'Rejected':
                title = 'Báo cáo vết nứt đã bị từ chối'
                content = `Báo cáo vết nứt của bạn tại vị trí "${existingReport.position}" đã bị từ chối. Vui lòng liên hệ quản lý để biết thêm chi tiết.`
                break
              case 'Completed':
                title = 'Báo cáo vết nứt đã được xử lý hoàn tất'
                content = `Báo cáo vết nứt của bạn tại vị trí "${existingReport.position}" đã được xử lý thành công.`
                break
              case 'WaitingConfirm':
                title = 'Yêu cầu đặt cọc để xử lý vết nứt'
                content = `Tòa nhà của bạn đã hết thời hạn bảo hành. Báo cáo vết nứt tại vị trí "${existingReport.position}" cần khoản đặt cọc trước khi tiếp tục xử lý.`
                break
            }

            // Kiểm tra xem title và content có dữ liệu không
            if (!title.trim() || !content.trim()) {
              this.logger.warn(`Skipping empty notification for crack report ${crackReportId} with status ${dto.status}`);
              return new ApiResponse(
                true,
                'Cập nhật báo cáo vết nứt thành công (bỏ qua thông báo trống)',
                [updatedReport]
              );
            }

            const notificationData = {
              userId: existingReport.reportedBy,
              title: title,
              content: content,
              type: NotificationType.SYSTEM,
              relatedId: crackReportId,
              link: `/crack-reports/${crackReportId}`
            }

            const notificationPattern = NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION
            // Directly send without any promise handling or complex approach, to simplify
            try {
              // Use message pattern for guaranteed delivery
              const response = await firstValueFrom(
                this.notificationsClient.emit(notificationPattern, notificationData).pipe(
                  timeout(15000),
                  catchError(err => {
                    return of({ success: false, error: err.message })
                  })
                )
              )

            } catch (error) {
              // Last resort: try event pattern
            }
          } catch (notificationError) {
          }
        }
      }
      return new ApiResponse(
        true,
        'Cập nhật báo cáo vết nứt thành công',
        [updatedReport]
      )
    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException(
        new ApiResponse(false, 'Lỗi hệ thống khi cập nhật báo cáo vết nứt')
      )
    }
  }

  async getCrackReportsByManagerId(
    managerid: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    severityFilter?: $Enums.Severity
  ) {
    try {
      this.logger.log(`Getting crack reports for manager with ID: ${managerid}`)

      // Validate pagination parameters
      if (page < 1 || limit < 1) {
        throw new RpcException(
          new ApiResponse(false, 'Invalid page or limit parameters')
        )
      }

      if (severityFilter && !Object.values($Enums.Severity).includes(severityFilter)) {
        throw new RpcException(
          new ApiResponse(false, 'Invalid severity filter')
        )
      }

      const skip = (page - 1) * limit

      // 1. Get all buildings managed by this manager
      const buildingsResponse = await firstValueFrom(
        this.buildingClient.send(BUILDINGS_PATTERN.GET_BY_MANAGER_ID, { managerId: managerid }).pipe(
          timeout(10000),
          retry(3),
          catchError(error => {
            this.logger.error(`Error fetching buildings for manager ${managerid}:`, error)
            throw new RpcException(new ApiResponse(false, 'Failed to fetch buildings for manager', error))
          })
        )
      )

      this.logger.log(`Buildings response: ${JSON.stringify(buildingsResponse)}`)

      if (!buildingsResponse || buildingsResponse.statusCode !== 200 || !buildingsResponse.data || buildingsResponse.data.length === 0) {
        this.logger.warn(`No buildings found for manager ${managerid}`)
        return new ApiResponse(true, 'No buildings found for this manager', {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        })
      }

      // 2. Extract all building detail IDs from the buildings
      const buildingDetails = buildingsResponse.data.flatMap(building => building.buildingDetails || [])
      const buildingDetailIds = buildingDetails.map(detail => detail.buildingDetailId)

      this.logger.log(`Found ${buildingDetailIds.length} building details for manager ${managerid}`)

      if (buildingDetailIds.length === 0) {
        this.logger.warn(`No building details found for manager ${managerid}`)
        return new ApiResponse(true, 'No building details found for buildings managed by this manager', {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        })
      }

      // 3. Build the where clause for the query
      const where: Prisma.CrackReportWhereInput = {
        buildingDetailId: {
          in: buildingDetailIds
        }
      }

      // Add search condition if search term is provided
      if (search) {
        where.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { position: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Add severity filter if provided
      if (severityFilter) {
        where.crackDetails = {
          some: {
            severity: severityFilter
          }
        }
      }

      // 4. Get total count for pagination
      const totalCount = await this.prismaService.crackReport.count({ where })

      // 5. Find crack reports with pagination
      const crackReports = await this.prismaService.crackReport.findMany({
        where,
        include: {
          crackDetails: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      })

      this.logger.log(`Found ${crackReports.length} crack reports for manager ${managerid}`)

      if (!crackReports || crackReports.length === 0) {
        this.logger.warn(`No crack reports found for building details managed by manager ${managerid}`)
        return new ApiResponse(true, 'No crack reports found for buildings managed by this manager', {
          data: [],
          pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
          }
        })
      }

      // 6. Enhance the data with pre-signed URLs and user information
      const reporterIds = [...new Set(crackReports.map(report => report.reportedBy))]
      const verifierIds = [...new Set(crackReports.map(report => report.verifiedBy))]
      const userMap = new Map()

      // Fetch user information
      await Promise.all([
        ...verifierIds.map(async (userId) => {
          try {
            if (userId) {
              const userResponse = await firstValueFrom(
                this.userService.GetUserInfo({ userId }).pipe(
                  catchError(error => {
                    this.logger.error(`Error fetching user data for ID ${userId}:`, error)
                    return of(null)
                  })
                )
              )

              if (userResponse) {
                userMap.set(userId, {
                  userId: userResponse.userId,
                  username: userResponse.username
                })
              }
            }
          } catch (error) {
            this.logger.error(`Failed to get user data for ID ${userId}:`, error)
          }
        }),
        ...reporterIds.map(async (userId) => {
          try {
            if (userId) {
              const userResponse = await firstValueFrom(
                this.userService.GetUserInfo({ userId }).pipe(
                  catchError(error => {
                    this.logger.error(`Error fetching user data for ID ${userId}:`, error)
                    return of(null)
                  })
                )
              )

              if (userResponse) {
                userMap.set(userId, {
                  userId: userResponse.userId,
                  username: userResponse.username
                })
              }
            }
          } catch (error) {
            this.logger.error(`Failed to get user data for ID ${userId}:`, error)
          }
        })
      ])

      // Create a map of buildingDetailId to buildingDetail and building info
      const buildingDetailMap = new Map()
      const buildingMap = new Map()

      buildingDetails.forEach(detail => {
        buildingDetailMap.set(detail.buildingDetailId, detail)
        const building = buildingsResponse.data.find(b => b.buildingId === detail.buildingId)
        if (building) {
          buildingMap.set(detail.buildingId, building)
        }
      })

      // Enhance the crack reports with additional information
      const enhancedReports = await Promise.all(crackReports.map(async report => {
        const userData = userMap.get(report.reportedBy)
        const verifierData = userMap.get(report.verifiedBy)
        const buildingDetail = buildingDetailMap.get(report.buildingDetailId)
        let building = null
        if (buildingDetail) {
          building = buildingMap.get(buildingDetail.buildingId)
        }

        return {
          ...report,
          reportedBy: {
            userId: report.reportedBy,
            username: userData?.username || 'Unknown'
          },
          verifiedBy: {
            userId: report.verifiedBy,
            username: verifierData?.username || 'Unknown'
          },
          building: building ? {
            buildingId: building.buildingId,
            name: building.name,
            area: building.area ? {
              areaId: building.area.areaId,
              name: building.area.name
            } : null
          } : null,
          buildingDetail: buildingDetail ? {
            buildingDetailId: buildingDetail.buildingDetailId,
            name: buildingDetail.name
          } : null,
          crackDetails: await Promise.all(report.crackDetails.map(async detail => ({
            ...detail,
            photoUrl: detail.photoUrl ? await this.getPreSignedUrl(this.extractFileKey(detail.photoUrl)) : null,
            aiDetectionUrl: detail.aiDetectionUrl ? await this.getPreSignedUrl(this.extractFileKey(detail.aiDetectionUrl)) : null,
          })))
        }
      }))

      this.logger.log(`Successfully enhanced ${enhancedReports.length} crack reports`)
      return new ApiResponse(true, 'Crack reports retrieved successfully', {
        data: enhancedReports,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      })

    } catch (error) {
      this.logger.error(`Error getting crack reports for manager ${managerid}:`, error)
      throw new RpcException(
        new ApiResponse(false, 'Error fetching crack reports for this manager', error)
      )
    }
  }

  async getBuildingAreaFromCrack(crack_id: string): Promise<ApiResponse<any>> {
    try {
      console.log(`Getting building area for crack ID: ${crack_id}`)

      // Get crack report by ID
      const crackReport = await this.prismaService.crackReport.findFirst({
        where: { crackReportId: crack_id },
        select: {
          crackReportId: true,
          buildingDetailId: true
        }
      })

      if (!crackReport) {
        console.log(`No crack report found with ID: ${crack_id}`)
        return new ApiResponse(
          false,
          `Không tìm thấy báo cáo vết nứt với ID: ${crack_id}`,
          null
        )
      }

      console.log(`Found crack report with buildingDetailId: ${crackReport.buildingDetailId}`)

      // Get building detail to find building
      console.log(`Sending request to get building detail with ID: ${crackReport.buildingDetailId}`)
      const buildingDetailResponse = await firstValueFrom(
        this.buildingClient.send(
          BUILDINGDETAIL_PATTERN.GET_BY_ID,
          { buildingDetailId: crackReport.buildingDetailId }
        ).pipe(
          timeout(10000),
          catchError(err => {
            console.error(`Error getting building detail: ${err.message}`)
            return of({ statusCode: 500, data: null })
          })
        )
      )

      console.log(`Building detail response:`, JSON.stringify(buildingDetailResponse, null, 2))

      // Check for successful response
      if (!buildingDetailResponse) {
        console.log(`Building detail response is null or undefined`)
        return new ApiResponse(
          false,
          `Không thể lấy thông tin chi tiết tòa nhà cho vết nứt này`,
          null
        )
      }

      if (buildingDetailResponse.statusCode !== 200) {
        console.log(`Building detail response has non-200 status code: ${buildingDetailResponse.statusCode}`)
        return new ApiResponse(
          false,
          `Không thể lấy thông tin chi tiết tòa nhà cho vết nứt này`,
          null
        )
      }

      // Check if we can extract area directly from the nested structure in buildingDetailResponse
      if (
        buildingDetailResponse.data?.building?.area?.name
      ) {
        const areaName = buildingDetailResponse.data.building.area.name
        console.log(`Area name found directly in building detail response: ${areaName}`)

        return new ApiResponse(
          true,
          `Lấy thông tin khu vực thành công`,
          { name: areaName }
        )
      }

      // If the area is not directly accessible, extract buildingId and continue
      console.log(`All properties in buildingDetailResponse:`, Object.keys(buildingDetailResponse))
      const buildingId = buildingDetailResponse.data?.buildingId

      if (!buildingId) {
        console.log(`Could not extract buildingId from response:`, JSON.stringify(buildingDetailResponse, null, 2))
        return new ApiResponse(
          false,
          `Không thể xác định ID tòa nhà từ chi tiết tòa nhà`,
          null
        )
      }

      console.log(`Extracted buildingId: ${buildingId}`)

      // Get building information to find area
      console.log(`Sending request to get building with ID: ${buildingId}`)
      const buildingResponse = await firstValueFrom(
        this.buildingClient.send(
          BUILDINGS_PATTERN.GET_BY_ID,
          { buildingId }
        ).pipe(
          timeout(10000),
          catchError(err => {
            console.error(`Error getting building: ${err.message}`)
            return of({ statusCode: 500, data: null })
          })
        )
      )

      console.log(`Building response:`, JSON.stringify(buildingResponse, null, 2))

      if (!buildingResponse || buildingResponse.statusCode !== 200) {
        console.log(`Invalid building response:`, JSON.stringify(buildingResponse, null, 2))
        return new ApiResponse(
          false,
          `Không thể lấy thông tin tòa nhà cho vết nứt này`,
          null
        )
      }

      // Check if we can get area name directly from the building data
      if (buildingResponse.data?.area?.name) {
        const areaName = buildingResponse.data.area.name
        console.log(`Area name found directly in building response: ${areaName}`)

        return new ApiResponse(
          true,
          `Lấy thông tin khu vực thành công`,
          { name: areaName }
        )
      }

      // If we can't get the area name directly, we need to get the area ID and do another call
      const areaId = buildingResponse.data?.areaId
      console.log(`Extracted areaId: ${areaId}`)

      if (!areaId) {
        console.log(`No areaId found in building data`)
        return new ApiResponse(
          false,
          `Tòa nhà không có thông tin khu vực`,
          null
        )
      }

      // Get area information
      console.log(`Sending request to get area with ID: ${areaId}`)
      const areaResponse = await firstValueFrom(
        this.buildingClient.send(
          AREAS_PATTERN.GET_BY_ID,
          { areaId }
        ).pipe(
          timeout(10000),
          catchError(err => {
            console.error(`Error getting area: ${err.message}`)
            return of({ statusCode: 500, data: null })
          })
        )
      )

      console.log(`Area response:`, JSON.stringify(areaResponse, null, 2))

      if (!areaResponse || areaResponse.statusCode !== 200) {
        console.log(`Invalid area response:`, JSON.stringify(areaResponse, null, 2))
        return new ApiResponse(
          false,
          `Không thể lấy thông tin khu vực cho tòa nhà này`,
          null
        )
      }

      const areaName = areaResponse.data?.name

      if (!areaName) {
        console.log(`Area name not found in response:`, JSON.stringify(areaResponse, null, 2))
        return new ApiResponse(
          false,
          `Không thể xác định tên khu vực`,
          null
        )
      }

      console.log(`Area name found: ${areaName}`)
      return new ApiResponse(
        true,
        `Lấy thông tin khu vực thành công`,
        { name: areaName }
      )
    } catch (error) {
      console.error(`Error getting building area from crack: ${error.message}`)
      return new ApiResponse(
        false,
        `Lỗi khi lấy thông tin khu vực từ vết nứt: ${error.message}`,
        null
      )
    }
  }

  // Add this method after the getBuildingDetailByTaskId method
  async getBuildingDetailByCrackId(crackId: string): Promise<ApiResponse<any>> {
    try {
      // Get the crack report to get the buildingDetailId
      const crackReport = await this.prismaService.crackReport.findUnique({
        where: { crackReportId: crackId },
        select: { buildingDetailId: true }
      });

      if (!crackReport) {
        throw new RpcException(
          new ApiResponse(false, `Không tìm thấy báo cáo vết nứt với ID = ${crackId}`)
        );
      }

      return new ApiResponse(
        true,
        'Lấy thông tin ID chi tiết tòa nhà thành công',
        { buildingDetailId: crackReport.buildingDetailId }
      );
    } catch (error) {
      console.error(`Error getting buildingDetailId for crack ${crackId}:`, error);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException(
        new ApiResponse(false, `Lỗi khi lấy thông tin ID chi tiết tòa nhà: ${error.message}`)
      );
    }
  }
}