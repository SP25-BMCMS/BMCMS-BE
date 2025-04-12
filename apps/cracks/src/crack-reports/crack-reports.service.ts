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
import { firstValueFrom, Observable, of } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto'
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { S3UploaderService, UploadResult } from '../crack-details/s3-uploader.service'
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns'
import { PrismaClient } from '@prisma/client-Task'

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
  constructor(
    private prismaService: PrismaService,
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy,
    @Inject(BUILDINGS_CLIENT) private readonly buildingClient: ClientProxy,
    @Inject(USERS_CLIENT) private readonly usersClient: ClientGrpc,
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

      // Get usernames for all reporters
      const reporterIds = [...new Set(crackReports.map(report => report.reportedBy))]
      const verifierIds = [...new Set(crackReports.map(report => report.verifiedBy))]

      const userMap = new Map()

      await Promise.all(verifierIds.map(async (userId) => {
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
      }))
      // Get user data for each reporter ID
      await Promise.all(reporterIds.map(async (userId) => {
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
      }))

      // Add username and presigned URLs to each crack report
      const enrichedReports = await Promise.all(crackReports.map(async report => {
        const userData = userMap.get(report.reportedBy)
        const verifierData = userMap.get(report.verifiedBy)

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
          crackDetails: await Promise.all(report.crackDetails.map(async detail => ({
            ...detail,
            photoUrl: detail.photoUrl ? await this.getPreSignedUrl(this.extractFileKey(detail.photoUrl)) : null,
            aiDetectionUrl: detail.aiDetectionUrl ? await this.getPreSignedUrl(this.extractFileKey(detail.aiDetectionUrl)) : null,
          })))
        }
      }))

      return {
        data: enrichedReports,
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
        new ApiResponse(false, 'Error when getting crack report!', error)
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
                    console.error('Error checking building detail:', error)
                    throw new RpcException({
                      status: 404,
                      message: 'buildingDetailId not found with id = ' + dto.buildingDetailId
                    })
                  }),
                ),
            )

            if (buildingDetail.statusCode === 404) {
              throw new RpcException({
                status: 404,
                message: 'buildingDetailId not found with id = ' + dto.buildingDetailId
              })
            }
          } catch (error) {
            if (error instanceof RpcException) {
              throw error
            }
            throw new RpcException({
              status: 404,
              message: 'buildingDetailId not found with id = ' + dto.buildingDetailId
            })
          }
        }

        // 🔹 Validate position format if isPrivatesAsset is false
        if (!dto.isPrivatesAsset) {
          const positionParts = dto.position?.split('/')
          if (!positionParts || positionParts.length !== 4) {
            throw new RpcException({
              status: 400,
              message: `Invalid position format. Expected format: "area/building/floor/direction". Provided: ${dto.position}`
            })

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
            position: dto.isPrivatesAsset ? dto.position : dto.position,
            status: dto.status ?? $Enums.ReportStatus.Pending,
            reportedBy: userId,
            verifiedBy: '123123123',
          },
        })

        console.log('🚀 CrackReport created:', newCrackReport)

        // 🔹 2. Create CrackDetails if isPrivatesAsset is true
        let newCrackDetails = []
        if (dto.files?.length > 0) {
          // Upload files to S3
          const uploadResult = await this.s3UploaderService.uploadFiles(dto.files)

          if (!uploadResult.isSuccess) {
            throw new RpcException({
              status: 400,
              message: uploadResult.message
            })
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

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            status: 400,
            message: 'Duplicate data error'
          })

        }
      }

      if (error instanceof RpcException) {
        throw error
      }

      throw new RpcException({
        status: 500,
        message: 'System error, please try again later'
      })

    }
  }

  async findById(crackReportId: string) {
    // Find the crack report with its details
    const report = await this.prismaService.crackReport.findUnique({
      where: { crackReportId },
      include: {
        crackDetails: true // Include all crack details for this report
      }
    })

    if (!report) {
      throw new RpcException(
        new ApiResponse(false, 'Crack Report không tồn tại'),
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

      // Thêm presigned URL cho từng crackDetail
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
        crackDetails: enhancedDetails // Sử dụng details đã xử lý
      }

      return new ApiResponse(true, 'Crack Report đã tìm thấy', [enhancedReport])
    } catch (error) {
      // If we encounter an error while enhancing the data, return the original report
      return new ApiResponse(true, 'Crack Report đã tìm thấy', [report])
    }
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
        const crackDetailIds = existingReport.crackDetails.map(detail => detail.crackDetailsId)




        // Xóa tất cả CrackDetail của báo cáo
        await prisma.crackDetail.deleteMany({
          where: { crackReportId }
        })

        // Xóa CrackReport
        await prisma.crackReport.delete({
          where: { crackReportId }
        })

        return new ApiResponse(true, 'Crack Report và các dữ liệu liên quan đã được xóa thành công', {
          crackReportId,
          crackDetailIds,
          deletedSegmentsCount: crackDetailIds.length > 0 ? crackDetailIds.length : 0,
          deletedDetailsCount: existingReport.crackDetails.length
        })
      })
    } catch (error) {
      console.error('Lỗi khi xóa Crack Report:', error)
      throw new RpcException(
        new ApiResponse(false, 'Lỗi hệ thống khi xóa Crack Report. Vui lòng thử lại sau.')
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

      // Start a real database transaction - all operations will be committed or rolled back together
      return await this.prismaService.$transaction(async (prisma) => {
        // Step 1: Find the crack report and validate it exists
        existingReport = await prisma.crackReport.findUnique({
          where: { crackReportId },
        })

        if (!existingReport) {
          throw new RpcException(
            new ApiResponse(false, 'Crack Report không tồn tại')
          )
        }

        // Step 2: Check if staff's area matches the crack report's area
        areaMatchResponse = await firstValueFrom(
          this.userService.checkStaffAreaMatch({ staffId, crackReportId })
        )

        if (!areaMatchResponse.isMatch) {
          throw new RpcException(
            new ApiResponse(false, 'Nhân viên không thuộc khu vực của báo cáo nứt này')
          )
        }
        const unconfirmedTasks = await this.prisma.taskAssignment.findMany({
          where: {
            employee_id: staffId,
            status: {
              notIn: [AssignmentStatus.Confirmed]
            }
          }
        })

        if (unconfirmedTasks.length > 0) {
          return {
            statusCode: 400,
            message: 'Staff has unconfirmed tasks. Cannot assign new task.',
            data: null
          }
        }

        // Step 3: Create task first - do this before updating report status
        createTaskResponse = await firstValueFrom(
          this.taskClient
            .send(TASKS_PATTERN.CREATE, {
              description: `Xử lý báo cáo vết nứt ${crackReportId}`,
              status: Status.Assigned,
              crack_id: crackReportId,
              schedule_job_id: '',
            })
            .pipe(
              timeout(10000), // Add timeout to prevent hanging
              catchError((error) => {
                console.error('Task creation error:', error)
                throw new RpcException(
                  new ApiResponse(false, 'Không thể tạo task')
                )
              })
            )
        )

        // Check if task creation was successful and task_id exists
        if (!createTaskResponse?.data?.task_id) {
          throw new RpcException(
            new ApiResponse(false, 'Task được tạo nhưng không trả về task_id hợp lệ')
          )
        }

        // Step 4: Create task assignment
        createTaskAssignmentResponse = await firstValueFrom(
          this.taskClient
            .send(TASKASSIGNMENT_PATTERN.ASSIGN_TO_EMPLOYEE, {
              taskId: createTaskResponse.data.task_id,
              employeeId: staffId,
              description: `Phân công xử lý báo cáo nứt tại ${existingReport.position}`,
              status: AssignmentStatus.Pending,
            })
            .pipe(
              timeout(10000), // Add timeout to prevent hanging
              catchError((error) => {
                console.error('Task assignment error:', error)
                throw new RpcException(
                  new ApiResponse(false, error.message || 'Không thể tạo phân công task')
                )
              }),
            ),
        )

        // Check task assignment response
        if (createTaskAssignmentResponse?.statusCode === 400) {
          throw new RpcException(
            new ApiResponse(false, createTaskAssignmentResponse.message || 'Lỗi phân công task')
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
          'Crack Report đã được cập nhật và Task đã được tạo',
          {
            crackReport: updatedReport,
            task: createTaskResponse,
            taskAssignment: createTaskAssignmentResponse,
          },
        )
      }, {
        // Set a long timeout for the transaction since we're making external calls
        timeout: 30000,
        // Use serializable isolation level for maximum consistency
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      })
    } catch (error) {
      console.error('🔥 Lỗi trong updateCrackReportStatus:', error)

      // Pass through RpcExceptions
      if (error instanceof RpcException) {
        throw error
      }

      // Wrap other errors
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
    console.log("🚀 Kha ne ~ userId:", userId)
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
      // Kiểm tra crack report có tồn tại không
      const existingReport = await this.prismaService.crackReport.findUnique({
        where: { crackReportId },
      })

      if (!existingReport) {
        throw new RpcException(
          new ApiResponse(false, 'Crack Report không tồn tại')
        )
      }

      // Cập nhật crack report
      const updatedReport = await this.prismaService.crackReport.update({
        where: { crackReportId },
        data: {
          ...dto,
          updatedAt: new Date(),
        },
        include: {
          crackDetails: true,
        },
      })

      return new ApiResponse(
        true,
        'Crack Report đã được cập nhật thành công',
        [updatedReport]
      )
    } catch (error) {
      console.error('Error updating crack report:', error)
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException(
        new ApiResponse(false, 'Lỗi hệ thống khi cập nhật Crack Report')
      )
    }
  }
}