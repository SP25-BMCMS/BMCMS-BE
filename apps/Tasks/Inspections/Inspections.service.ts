import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { PrismaService } from '../prisma/prisma.service'
import { ApiResponse } from '../../../libs/contracts/src/ApiResponse/api-response'
import { UpdateInspectionDto } from '../../../libs/contracts/src/inspections/update-inspection.dto'
import { CreateInspectionDto, RepairMaterialDto } from '@app/contracts/inspections/create-inspection.dto'
import { Inspection } from '@prisma/client-Task'
import { ChangeInspectionStatusDto } from '@app/contracts/inspections/change-inspection-status.dto'
import { AddImageToInspectionDto } from '@app/contracts/inspections/add-image.dto'
import { ClientGrpc, ClientProxy } from '@nestjs/microservices'
import { catchError, firstValueFrom, Observable, of, timeout } from 'rxjs'
import { IsUUID } from 'class-validator'
import { MATERIAL_PATTERN } from '@app/contracts/materials/material.patterns'
import { TASK_CLIENT } from 'apps/api-gateway/src/constraints'
import { GetObjectCommand, S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ConfigService } from '@nestjs/config'
import { TaskAssignmentsService } from '../TaskAssignments/TaskAssignments.service'
import { AssignmentStatus } from '@prisma/client-Task'
import { TaskService } from '../Task/Task.service'
import { UpdateInspectionReportStatusDto, ReportStatus } from '@app/contracts/inspections/update-inspection-report-status.dto'

const USERS_CLIENT = 'USERS_CLIENT'
// Define interface for the User service
interface UserService {
  getUserInfo(data: UserRequest): Observable<any>
  getWorkingPositionById(data: WorkingPositionByIdRequest): Observable<any>
}

// Define matching interfaces cho proto
interface UserRequest {
  userId: string
  username: string
}

interface WorkingPositionByIdRequest {
  positionId: string
}

// Định nghĩa CRACK_PATTERNS cho pattern get-crack-detail-by-id
const CRACK_PATTERNS = {
  GET_DETAILS: { cmd: 'get-crack-report-by-id' }
}

@Injectable()
export class InspectionsService implements OnModuleInit {
  private userService: UserService
  private s3: S3Client
  private bucketName: string
  private readonly logger = new Logger(InspectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('CRACK_CLIENT') private readonly crackClient: ClientProxy,
    @Inject(USERS_CLIENT) private readonly userClient: ClientGrpc,
    @Inject(TASK_CLIENT) private readonly taskClient: ClientProxy,
    private configService: ConfigService,
    private readonly taskAssignmentService: TaskAssignmentsService,
    private readonly taskService: TaskService
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

  onModuleInit() {
    console.log('InspectionsService - onModuleInit called')

    // Kiểm tra xem userClient có được inject đúng không
    if (!this.userClient) {
      console.error('userClient is undefined in onModuleInit')
      return
    }

    try {
      this.userService = this.userClient.getService<UserService>('UserService')
      console.log('userService initialized:', this.userService ? 'Successfully' : 'Failed')
    } catch (error) {
      console.error('Error initializing userService:', error)
    }
  }

  /**
   * Get pre-signed URL for an S3 object
   * @param fileKey The S3 object key
   * @returns A pre-signed URL for accessing the object
   */
  async getPreSignedUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    })

    return getSignedUrl(this.s3, command, { expiresIn: 86400 }) // URL expires after 24 hours
  }

  /**
   * Extract S3 file key from full URL
   * @param url Full S3 URL
   * @returns The file key part
   */
  private extractFileKey(url: string): string {
    try {
      // If already a key rather than a URL, return as is
      if (!url.startsWith('http')) {
        return url
      }

      // Extract key from URL
      const urlObj = new URL(url)
      return urlObj.pathname.substring(1) // Remove leading '/'
    } catch (error) {
      console.error('Invalid URL format:', url)
      return url // Return original as fallback
    }
  }

  async GetInspectionByTaskAssignmentId(task_assignment_id: string) {
    try {
      const inspections = await this.prisma.inspection.findMany({
        where: { task_assignment_id },
      })

      if (inspections.length === 0) {
        return {
          statusCode: 404,
          message:
            'Không tìm thấy kiểm tra nào cho nhiệm vụ này với ID = ' +
            task_assignment_id,
        }
      }

      // Xử lý presignedUrl cho mỗi inspection
      for (const inspection of inspections) {
        // Process image URLs
        if (inspection.image_urls && inspection.image_urls.length > 0) {
          inspection.image_urls = await Promise.all(
            inspection.image_urls.map(async (url: string) => {
              try {
                const fileKey = this.extractFileKey(url)
                return await this.getPreSignedUrl(fileKey)
              } catch (error) {
                console.error(`Error getting pre-signed URL for ${url}:`, error)
                return url // Return original URL as fallback
              }
            })
          )
        }

        // Process PDF file URL if exists
        if (inspection.uploadFile) {
          try {
            const fileKey = this.extractFileKey(inspection.uploadFile)
            inspection.uploadFile = await this.getPreSignedUrl(fileKey)
          } catch (error) {
            console.error(`Error getting pre-signed URL for PDF file:`, error)
            // Keep original URL as fallback
          }
        }
      }

      return {
        statusCode: 200,
        message: 'Lấy danh sách kiểm tra thành công',
        data: inspections,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách kiểm tra cho nhiệm vụ',
      })
    }
  }

  async updateInspection(inspection_id: string, dto: UpdateInspectionDto) {
    const existingInspection = await this.prisma.inspection.findUnique({
      where: { inspection_id },
    })

    if (!existingInspection) {
      throw new RpcException(
        new ApiResponse(false, 'Không tồn tại kiểm tra'),
      )
    }

    try {
      const updatedInspection = await this.prisma.inspection.update({
        where: { inspection_id },
        data: { ...dto },
      })
      return new ApiResponse(true, 'Cập nhật kiểm tra thành công', [
        updatedInspection,
      ])
    } catch (error) {
      throw new RpcException(new ApiResponse(false, 'Dữ liệu không hợp lệ'))
    }
  }

  // async GetInspectionByCrackId(crack_id: string) {
  //   try {
  //     const inspections = await this.prisma.inspection.findMany({
  //       where: { crack_id },
  //     });

  //     if (inspections.length === 0) {
  //       return {
  //         statusCode: 404,
  //         message: 'No inspections found for this crack id = ' + crack_id,
  //       };
  //     }

  //     return {
  //       statusCode: 200,
  //       message: 'Inspections retrieved successfully',
  //       data: inspections
  //     };
  //   } catch (error) {
  //     throw new RpcException({
  //       statusCode: 500,
  //       message: 'Error retrieving inspections for crack',
  //       error: error.message
  //     });
  //   }
  // }

  async GetAllInspections() {
    try {
      const inspections = await this.prisma.inspection.findMany({
        include: {
          taskAssignment: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      })

      if (inspections.length === 0) {
        return {
          statusCode: 404,
          message: 'Không tìm thấy kiểm tra nào',
          data: [],
        }
      }

      // Process image URLs and PDF files for each inspection
      for (const inspection of inspections) {
        // Process image URLs
        if (inspection.image_urls && inspection.image_urls.length > 0) {
          inspection.image_urls = await Promise.all(
            inspection.image_urls.map(async (url: string) => {
              try {
                const fileKey = this.extractFileKey(url)
                return await this.getPreSignedUrl(fileKey)
              } catch (error) {
                console.error(`Error getting pre-signed URL for ${url}:`, error)
                return url // Return original URL as fallback
              }
            })
          )
        }

        // Process PDF file URL if exists
        if (inspection.uploadFile) {
          try {
            const fileKey = this.extractFileKey(inspection.uploadFile)
            inspection.uploadFile = await this.getPreSignedUrl(fileKey)
          } catch (error) {
            console.error(`Error getting pre-signed URL for PDF file:`, error)
            // Keep original URL as fallback
          }
        }
      }

      return {
        statusCode: 200,
        message: 'Lấy danh sách kiểm tra thành công',
        data: inspections,
        total: inspections.length,
      }
    } catch (error) {
      console.error('Error in GetAllInspections:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách kiểm tra',
        error: error.message,
      })
    }
  }

  async createInspection(dto: CreateInspectionDto): Promise<ApiResponse<Inspection>> {
    try {
      console.log('Received inspection data:', JSON.stringify({
        ...dto,
        image_urls: dto.image_urls ? `${dto.image_urls.length} images` : 'none',
        repairMaterials: dto.repairMaterials ? `received (type: ${typeof dto.repairMaterials})` : 'none'
      }));

      if (dto.repairMaterials) {
        if (typeof dto.repairMaterials === 'string') {
          console.log('repairMaterials string content:', dto.repairMaterials);
        } else if (Array.isArray(dto.repairMaterials)) {
          console.log('repairMaterials array length:', dto.repairMaterials.length);
        }
      }

      // Check if task assignment exists
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: dto.task_assignment_id },
      })

      if (!taskAssignment) {
        return new ApiResponse(false, 'Không tìm thấy nhiệm vụ được phân công', null)
      }

      // Ensure inspected_by is provided (this should always be set by the API Gateway from the token)
      if (!dto.inspected_by) {
        return new ApiResponse(false, 'Không tìm thấy ID người dùng trong token', null)
      }

      // Verify that the user is a Staff
      const staffVerification = await this.verifyStaffRole(dto.inspected_by)
      if (!staffVerification.isSuccess) {
        return new ApiResponse(
          false,
          staffVerification.message,
          null
        )
      }

      // Parse repairMaterials if it's a string
      let repairMaterialsArray: RepairMaterialDto[] = [];
      try {
        const repairMaterials = dto.repairMaterials as string | RepairMaterialDto[]

        // Handle empty string or undefined
        if (!repairMaterials || (typeof repairMaterials === 'string' && repairMaterials.trim() === '')) {
          // Set to empty array if empty or not provided
          repairMaterialsArray = [];
        } else if (typeof repairMaterials === 'string') {
          // Handle case where multiple objects are sent as separate strings
          const repairMaterialsStr = repairMaterials.trim()
          if (repairMaterialsStr.startsWith('{') && repairMaterialsStr.includes('},{')) {
            // Format: {obj1},{obj2}
            repairMaterialsArray = JSON.parse('[' + repairMaterialsStr + ']')
          } else {
            // Single object or array
            repairMaterialsArray = JSON.parse(repairMaterialsStr)
          }
        } else if (Array.isArray(repairMaterials)) {
          repairMaterialsArray = repairMaterials
        } else {
          throw new Error('Định dạng vật liệu sửa chữa không hợp lệ')
        }
      } catch (error) {
        console.error('Error parsing repairMaterials:', error)
        return new ApiResponse(false, 'Định dạng vật liệu sửa chữa không hợp lệ', null)
      }

      // Validate all materials and calculate total cost
      let totalCost = 0

      // Skip validation if no repair materials
      if (repairMaterialsArray.length > 0) {
        const materialValidations = await Promise.all(
          repairMaterialsArray.map(async (repairMaterial) => {
            const materialResponse = await firstValueFrom(
              this.taskClient.send(
                MATERIAL_PATTERN.GET_MATERIAL_BY_ID,
                repairMaterial.materialId
              ).pipe(
                timeout(10000),
                catchError(err => {
                  console.error('Error getting material info:', err)
                  return of(new ApiResponse(false, 'Lỗi khi lấy thông tin vật liệu', null))
                })
              )
            )

            if (!materialResponse || !materialResponse.isSuccess || !materialResponse.data) {
              throw new Error(`Không tìm thấy vật liệu hoặc lỗi khi lấy thông tin vật liệu với ID: ${repairMaterial.materialId}`)
            }

            const material = materialResponse.data

            // Check if there's enough stock
            if (material.stock_quantity < repairMaterial.quantity) {
              throw new Error(`Không đủ số lượng tồn kho cho vật liệu ${material.name}. Số lượng hiện có: ${material.stock_quantity}, Yêu cầu: ${repairMaterial.quantity}`)
            }

            // Calculate cost for this material
            const unitCost = Number(material.unit_price)
            const materialTotalCost = unitCost * repairMaterial.quantity
            totalCost += materialTotalCost

            return {
              material,
              repairMaterial,
              unitCost,
              materialTotalCost
            }
          })
        )

        // Create inspection and repair materials in a transaction
        const result = await this.prisma.$transaction(async (prisma) => {
          // Create the inspection
          const inspection = await prisma.inspection.create({
            data: {
              task_assignment_id: dto.task_assignment_id,
              inspected_by: dto.inspected_by,
              image_urls: dto.image_urls || [],
              description: dto.description || "",
              total_cost: totalCost,
              uploadFile: dto.uploadFile || null,
            },
          })

          // Create all repair materials
          const repairMaterials = await Promise.all(
            materialValidations.map(async (validation) => {
              const repairMaterial = await prisma.repairMaterial.create({
                data: {
                  inspection_id: inspection.inspection_id,
                  material_id: validation.repairMaterial.materialId,
                  quantity: validation.repairMaterial.quantity,
                  unit_cost: validation.unitCost,
                  total_cost: validation.materialTotalCost,
                },
              })

              // Update material stock
              await prisma.material.update({
                where: { material_id: validation.repairMaterial.materialId },
                data: {
                  stock_quantity: {
                    decrement: validation.repairMaterial.quantity,
                  },
                },
              })

              return repairMaterial
            })
          )

          return {
            ...inspection,
            repairMaterials,
          }
        })

        return new ApiResponse(
          true,
          'Tạo kiểm tra và vật liệu sửa chữa thành công',
          result
        )
      } else {
        // No repair materials, just create the inspection
        const inspection = await this.prisma.inspection.create({
          data: {
            task_assignment_id: dto.task_assignment_id,
            inspected_by: dto.inspected_by,
            image_urls: dto.image_urls || [],
            description: dto.description || "",
            total_cost: 0,
            uploadFile: dto.uploadFile || null,
          },
        })

        return new ApiResponse(
          true,
          'Tạo kiểm tra thành công không có vật liệu sửa chữa',
          inspection
        )
      }
    } catch (error) {
      console.error('Error in createInspection:', error)
      return new ApiResponse(false, error.message || 'Lỗi khi tạo kiểm tra và vật liệu sửa chữa', null)
    }
  }

  // async changeStatus(dto: ChangeInspectionStatusDto): Promise<ApiResponse<Inspection>> {
  //   try {
  //     const inspection = await this.prisma.inspection.findUnique({
  //       where: { inspection_id: dto.inspection_id },
  //     });

  //     if (!inspection) {
  //       return new ApiResponse(false, 'Inspection not found', null);
  //     }

  //     const updatedInspection = await this.prisma.inspection.update({
  //       where: { inspection_id: dto.inspection_id },
  //       data: { status: dto.status },
  //     });

  //     return new ApiResponse(true, 'Inspection status updated successfully', updatedInspection);
  //   } catch (error) {
  //     return new ApiResponse(false, 'Error updating inspection status', error.message);
  //   }
  // }

  async addImage(dto: AddImageToInspectionDto): Promise<ApiResponse<Inspection>> {
    try {
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id: dto.inspection_id },
      })

      if (!inspection) {
        return new ApiResponse(false, 'Không tìm thấy kiểm tra', null)
      }

      // Get current image_urls array or initialize as empty array
      const currentImageUrls = inspection.image_urls || []

      // Add new images to the array
      const updatedImageUrls = [...currentImageUrls, ...dto.image_urls]

      const updatedInspection = await this.prisma.inspection.update({
        where: { inspection_id: dto.inspection_id },
        data: { image_urls: updatedImageUrls },
      })

      return new ApiResponse(true, 'Thêm hình ảnh thành công', updatedInspection)
    } catch (error) {
      return new ApiResponse(false, 'Lỗi khi thêm hình ảnh', error.message)
    }
  }

  async getInspectionDetails(inspection_id: string): Promise<ApiResponse<any>> {
    try {
      // 1. Get inspection with task assignment
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id },
        include: {
          taskAssignment: {
            include: {
              task: true
            }
          }
        }
      })

      if (!inspection) {
        return new ApiResponse(false, 'Không tìm thấy kiểm tra', null)
      }

      const result: any = { ...inspection }

      // Process main inspection image URLs
      if (result.image_urls && result.image_urls.length > 0) {
        result.image_urls = await Promise.all(
          result.image_urls.map(async (url: string) => {
            try {
              const fileKey = this.extractFileKey(url)
              return await this.getPreSignedUrl(fileKey)
            } catch (error) {
              console.error(`Error getting pre-signed URL for ${url}:`, error)
              return url // Return original URL as fallback
            }
          })
        )
      }

      // Process PDF file URL if exists
      if (result.uploadFile) {
        try {
          const fileKey = this.extractFileKey(result.uploadFile)
          result.uploadFile = await this.getPreSignedUrl(fileKey)
        } catch (error) {
          console.error(`Error getting pre-signed URL for PDF file:`, error)
          // Keep original URL as fallback
        }
      }

      // 2. Get task info
      const task = inspection.taskAssignment.task
      console.log(task)

      // 3. If crack_id exists, get crack info
      if (task.crack_id) {
        console.log("🚀 ~ InspectionsService ~ getInspectionDetails ~ task.crack_id:", task.crack_id)
        const crackInfo = await firstValueFrom(
          this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
        )
        result.crackInfo = crackInfo
        console.log("🚀 ~ InspectionsService ~ getInspectionDetails ~ crackInfo:", crackInfo)

        // Process crack images if they exist
        if (result.crackInfo && result.crackInfo.data) {
          const crackData = result.crackInfo.data

          // Process crack main image if it exists
          if (crackData.photoUrl) {
            try {
              const fileKey = this.extractFileKey(crackData.photoUrl)
              crackData.photoUrl = await this.getPreSignedUrl(fileKey)
            } catch (error) {
              console.error(`Error getting pre-signed URL for crack photo:`, error)
            }
          }

          // Process crack detail images if they exist
          if (crackData.crackDetails && Array.isArray(crackData.crackDetails)) {
            for (const detail of crackData.crackDetails) {
              if (detail.photoUrl) {
                try {
                  const fileKey = this.extractFileKey(detail.photoUrl)
                  detail.photoUrl = await this.getPreSignedUrl(fileKey)
                } catch (error) {
                  console.error(`Error getting pre-signed URL for crack detail photo:`, error)
                }
              }

              if (detail.aiDetectionUrl) {
                try {
                  const fileKey = this.extractFileKey(detail.aiDetectionUrl)
                  detail.aiDetectionUrl = await this.getPreSignedUrl(fileKey)
                } catch (error) {
                  console.error(`Error getting pre-signed URL for AI detection image:`, error)
                }
              }
            }
          }
        }
      }

      // 4. If schedule_id exists, get schedule info (you can add this later)
      if (task.schedule_job_id) {
        // Add schedule info retrieval here
      }

      return new ApiResponse(true, 'Lấy chi tiết kiểm tra thành công', result)
    } catch (error) {
      return new ApiResponse(false, 'Lỗi khi lấy chi tiết kiểm tra', error.message)
    }
  }

  async getInspectionById(inspection_id: string): Promise<ApiResponse<any>> {
    try {
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id },
        include: {
          taskAssignment: {
            include: {
              task: true
            }
          },
          repairMaterials: true
        }
      })

      if (!inspection) {
        return new ApiResponse(false, 'Không tìm thấy kiểm tra', null)
      }

      // Process image URLs
      if (inspection.image_urls && inspection.image_urls.length > 0) {
        inspection.image_urls = await Promise.all(
          inspection.image_urls.map(async (url: string) => {
            try {
              const fileKey = this.extractFileKey(url)
              return await this.getPreSignedUrl(fileKey)
            } catch (error) {
              console.error(`Error getting pre-signed URL for ${url}:`, error)
              return url // Return original URL as fallback
            }
          })
        )
      }

      // Process PDF file URL if exists
      if (inspection.uploadFile) {
        try {
          const fileKey = this.extractFileKey(inspection.uploadFile)
          inspection.uploadFile = await this.getPreSignedUrl(fileKey)
        } catch (error) {
          console.error(`Error getting pre-signed URL for PDF file:`, error)
          // Keep original URL as fallback
        }
      }

      return new ApiResponse(true, 'Lấy thông tin kiểm tra thành công', inspection)
    } catch (error) {
      console.error('Error retrieving inspection:', error)
      return new ApiResponse(false, 'Lỗi khi lấy thông tin kiểm tra', error.message)
    }
  }

  async getBuildingDetailIdFromTaskAssignment(task_assignment_id: string): Promise<ApiResponse<any>> {
    try {
      console.log(`Finding task assignment with ID: ${task_assignment_id}`)

      // First find the TaskAssignment
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: task_assignment_id },
        include: {
          task: true, // Include Task relation
        },
      })

      console.log('Task assignment found:', JSON.stringify(taskAssignment, null, 2))

      if (!taskAssignment || !taskAssignment.task) {
        console.log('TaskAssignment or Task not found:', task_assignment_id)
        return new ApiResponse(false, 'Không tìm thấy nhiệm vụ được phân công hoặc nhiệm vụ', null)
      }

      // Use the task_id to get the BuildingDetailId from Crack service
      const taskId = taskAssignment.task.task_id
      console.log(`Using task_id: ${taskId} to get buildingDetailId`)
      console.log(`Task details: crack_id=${taskAssignment.task.crack_id}`)

      // Call the CRACK service to get buildingDetailId using task_id
      console.log(`Calling crack service with task_id=${taskId}`)
      const crackResponse = await firstValueFrom(
        this.crackClient.send(
          { cmd: 'get-buildingDetail-by-task-id' },
          { taskId }
        ).pipe(
          timeout(10000),
          catchError(err => {
            console.error('Error getting building detail by task ID:', err)
            return of({ isSuccess: false, data: null })
          })
        )
      )

      console.log('Crack service response:', JSON.stringify(crackResponse, null, 2))

      if (!crackResponse || !crackResponse.isSuccess || !crackResponse.data) {
        console.log('Failed to get building detail from crack service')
        return new ApiResponse(false, 'Không thể lấy thông tin tòa nhà', null)
      }

      // Extract buildingDetailId from the response
      const buildingDetailId = crackResponse.data.buildingDetailId

      if (!buildingDetailId) {
        console.log('BuildingDetailId not found in crack response')
        return new ApiResponse(false, 'Không tìm thấy ID chi tiết tòa nhà', null)
      }

      console.log('Successfully retrieved buildingDetailId:', buildingDetailId)
      return new ApiResponse(true, 'Lấy ID chi tiết tòa nhà thành công', { buildingDetailId })
    } catch (error) {
      console.error('Error in getBuildingDetailIdFromTaskAssignment:', error)
      return new ApiResponse(false, 'Lỗi khi lấy ID chi tiết tòa nhà', null)
    }
  }
  async verifyStaffRole(userId: string): Promise<ApiResponse<boolean>> {
    try {
      console.log(`Tasks microservice - Verifying if user ${userId} is a Staff...`)

      // Ensure userService is initialized
      if (!this.userService) {
        console.log('userService is undefined, attempting to reinitialize')
        try {
          this.userService = this.userClient.getService<UserService>('UserService')
          console.log('userService reinitialized:', this.userService ? 'Successfully' : 'Failed')

          if (!this.userService) {
            console.error('userService still undefined after reinitialization attempt')
            return new ApiResponse(false, 'Không thể khởi tạo dịch vụ người dùng - gRPC client có thể không được kết nối', false)
          }
        } catch (error) {
          console.error('Error reinitializing userService:', error)
          return new ApiResponse(false, `Lỗi khởi tạo dịch vụ: ${error.message}`, false)
        }
      }

      // Test the gRPC connection by directly checking methods
      if (!this.userService.getUserInfo) {
        console.error('getUserInfo method is not available in userService')
        // Try to get available methods
        const methods = Object.keys(this.userService)
        console.log('Available methods in userService:', methods)
        return new ApiResponse(false, 'Dịch vụ người dùng được khởi tạo không đúng - getUserInfo không khả dụng', false)
      }

      // Get user details from User service using gRPC
      console.log('About to call getUserInfo with gRPC')
      let userInfo
      try {
        userInfo = await firstValueFrom(
          this.userService.getUserInfo({ userId, username: '' } as UserRequest)
            .pipe(
              timeout(10000),
              catchError(err => {
                console.error('Error fetching user info in Tasks service:', err)
                return of(null)
              })
            )
        )
      } catch (error) {
        console.error('Critical error calling getUserInfo:', error)
        return new ApiResponse(false, `Lỗi khi gọi getUserInfo: ${error.message}`, false)
      }

      console.log('Tasks microservice - User info received:', JSON.stringify(userInfo, null, 2))

      if (!userInfo) {
        console.error('Tasks microservice - User info is null or undefined')
        return new ApiResponse(false, 'Không tìm thấy người dùng', false)
      }

      // Check if user has role Staff
      const role = userInfo.role
      console.log(`Tasks microservice - User role: ${role}`)

      if (role !== 'Staff') {
        console.log(`Tasks microservice - User role ${role} is not Staff`)
        return new ApiResponse(
          false,
          `Chỉ nhân viên mới có thể tạo kiểm tra. Vai trò hiện tại: ${role}`,
          false
        )
      }

      console.log('Tasks microservice - User is a Staff, validation successful')
      return new ApiResponse(true, 'Người dùng là nhân viên', true)
    } catch (error) {
      console.error('Tasks microservice - Error in verifyStaffRole:', error)
      return new ApiResponse(false, `Lỗi khi xác thực vai trò người dùng: ${error.message}`, false)
    }
  }

  async updateInspectionPrivateAsset(
    inspection_id: string,
    dto: { isprivateasset: boolean }
  ) {
    try {
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id },
        include: {
          taskAssignment: true
        }
      });

      if (!inspection) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy kiểm tra',
        });
      }

      const updatedInspection = await this.prisma.inspection.update({
        where: { inspection_id },
        data: {
          isprivateasset: dto.isprivateasset
        },
        include: {
          taskAssignment: true,
          repairMaterials: true
        }
      });

      return new ApiResponse(
        true,
        'Cập nhật trạng thái tài sản riêng của kiểm tra thành công',
        updatedInspection
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: `Không thể cập nhật trạng thái tài sản riêng của kiểm tra: ${error.message}`,
      });
    }
  }

  async updateInspectionReportStatus(
    inspection_id: string,
    dto: { report_status: 'NoPending' | 'Pending' | 'Approved' | 'Rejected' | 'AutoApproved' }
  ) {
    try {
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id },
        include: {
          taskAssignment: true
        }
      });

      if (!inspection) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy kiểm tra',
        });
      }

      // Update the inspection report status
      const updatedInspection = await this.prisma.inspection.update({
        where: { inspection_id },
        data: {
          report_status: dto.report_status
        },
        include: {
          taskAssignment: true,
          repairMaterials: true
        }
      });

      // Handle special cases for report status changes
      if (dto.report_status === 'Rejected' && inspection.isprivateasset === true) {
        return new ApiResponse(
          true,
          'Đã có trong hệ thống lịch trình bảo trì của chúng tôi',
          updatedInspection
        );
      }
      else if (dto.report_status === 'Approved') {
        return new ApiResponse(
          true,
          'Chúng tôi đã nhận và sẽ xem xét',
          updatedInspection
        );
      }

      return new ApiResponse(
        true,
        'Cập nhật trạng thái báo cáo kiểm tra thành công',
        updatedInspection
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: `Không thể cập nhật trạng thái báo cáo kiểm tra: ${error.message}`,
      });
    }
  }

  async updateInspectionReportStatusByManager(
    inspection_id: string,
    report_status: ReportStatus,
    userId: string,
    reason: string
  ) {
    try {
      // Kiểm tra inspection có tồn tại không
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id },
        include: {
          taskAssignment: true
        }
      });

      if (!inspection) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy kiểm tra',
        });
      }
      console.log(inspection)

      // Kiểm tra user có phải là manager không
      // const userInfo = await firstValueFrom(
      //   this.userService.getUserInfo({ userId, username: '' } as UserRequest)
      //     .pipe(
      //       timeout(10000),
      //       catchError(err => {
      //         console.error('Error fetching user info:', err);
      //         return of(null);
      //       })
      //     )
      // );
      // console.log(userInfo)
      // if (!userInfo || userInfo.role !== 'Manager') {
      //   throw new RpcException({
      //     statusCode: 403,
      //     message: 'Only managers can update inspection report status',
      //   });
      // }
      console.log(inspection)
      // Cập nhật trạng thái báo cáo kiểm tra
      const updatedInspection = await this.prisma.inspection.update({
        where: { inspection_id },
        data: {
          confirmed_by: userId,
          report_status: report_status,
          updated_at: new Date(),
          reason: reason
        },
        include: {
          taskAssignment: true,
          repairMaterials: true
        }
      });
      console.log(updatedInspection)
      // Xử lý các trường hợp đặc biệt cho thay đổi trạng thái báo cáo
      if (report_status === 'Rejected' && inspection.isprivateasset === true) {
        return new ApiResponse(
          true,
          'Đã có trong hệ thống lịch trình bảo trì của chúng tôi',
          updatedInspection
        );
      }
      else if (report_status === 'Approved') {
        return new ApiResponse(
          true,
          'Chúng tôi đã nhận và sẽ xem xét',
          updatedInspection
        );
      }

      return new ApiResponse(
        true,
        'Cập nhật trạng thái báo cáo kiểm tra thành công',
        updatedInspection
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: `Không thể cập nhật trạng thái báo cáo kiểm tra: ${error.message}`,
      });
    }
  }
}
