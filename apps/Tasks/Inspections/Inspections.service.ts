import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { PrismaService } from '../prisma/prisma.service'
import { ApiResponse } from '../../../libs/contracts/src/ApiResponse/api-response'
import { UpdateInspectionDto } from '../../../libs/contracts/src/inspections/update-inspection.dto'
import { CreateInspectionDto, RepairMaterialDto } from '@app/contracts/inspections/create-inspection.dto'
import { Inspection } from '@prisma/client-Task'
import { ChangeInspectionStatusDto } from '@app/contracts/inspections/change-inspection-status.dto'
import { AddImageToInspectionDto } from '@app/contracts/inspections/add-image.dto'
import { ClientGrpc, ClientProxy, Client } from '@nestjs/microservices'
import { catchError, firstValueFrom, Observable, of, timeout, lastValueFrom } from 'rxjs'
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
import { PrismaClient as SchedulePrismaClient } from '@prisma/client-schedule'
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns'
import { AREAS_PATTERN } from '@app/contracts/Areas/Areas.patterns'
import { SCHEDULEJOB_PATTERN } from '@app/contracts/schedulejob/schedulejob.patterns'
import { BUILDINGDETAIL_PATTERN } from '@app/contracts/BuildingDetails/buildingdetails.patterns'
import { WORKLOG_PATTERN } from '@app/contracts/Worklog/Worklog.patterns'
import { TASKS_PATTERN } from '@app/contracts/tasks/task.patterns'

const USERS_CLIENT = 'USERS_CLIENT'
// Define interface for the User service
interface UserService {
  getUserInfo(data: UserRequest): Observable<any>
  getWorkingPositionById(data: WorkingPositionByIdRequest): Observable<any>
  getDepartmentById(data: DepartmentByIdRequest): Observable<any>
}

// Define matching interfaces cho proto
interface UserRequest {
  userId: string
  username: string
}

interface WorkingPositionByIdRequest {
  positionId: string
}

interface DepartmentByIdRequest {
  departmentId: string
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
    @Inject('SCHEDULE_CLIENT') private readonly scheduleClient: ClientProxy,
    @Inject(USERS_CLIENT) private readonly userClient: ClientGrpc,
    @Inject(TASK_CLIENT) private readonly taskClient: ClientProxy,
    private configService: ConfigService,
    private readonly taskAssignmentService: TaskAssignmentsService,
    private readonly taskService: TaskService,
    @Inject('BUILDINGS_CLIENT') private readonly buildingsClient: ClientProxy
  ) {
    // Initialize S3 client
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    })
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET')

    // Initialize userService here like in TaskService instead of onModuleInit
    try {
      this.userService = this.userClient.getService<UserService>('UserService')
      console.log('InspectionService - userService initialized:', this.userService ? 'Successfully' : 'Failed')
    } catch (error) {
      console.error('Error initializing userService in constructor:', error)
    }
  }

  onModuleInit() {
    console.log('InspectionsService - onModuleInit called')

    // Double-check userService initialization as a fallback
    if (!this.userService) {
      console.warn('userService not initialized in constructor, trying in onModuleInit')

      // Kiểm tra xem userClient có được inject đúng không
      if (!this.userClient) {
        console.error('userClient is undefined in onModuleInit')
        return
      }

      try {
        this.userService = this.userClient.getService<UserService>('UserService')
        console.log('userService initialized in onModuleInit:', this.userService ? 'Successfully' : 'Failed')
      } catch (error) {
        console.error('Error initializing userService in onModuleInit:', error)
      }
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

  /**
   * Get pre-signed URL for an S3 object with content disposition for downloading
   * @param fileKey The S3 object key
   * @returns A pre-signed URL for downloading the object
   */
  async getPreSignedDownloadUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ResponseContentDisposition: 'attachment; filename="' + fileKey.split('/').pop() + '"',
    });

    return getSignedUrl(this.s3, command, { expiresIn: 86400 }) // URL expires after 24 hours
  }

  async GetInspectionByTaskAssignmentId(task_assignment_id: string) {
    try {
      const inspections = await this.prisma.inspection.findMany({
        where: { task_assignment_id },
        include: {
          taskAssignment: {
            include: {
              task: true
            }
          }
        }
      })

      if (inspections.length === 0) {
        return {
          statusCode: 404,
          message:
            'Không tìm thấy báo cáo nào cho nhiệm vụ này với ID = ' +
            task_assignment_id,
        }
      }

      // Lấy thông tin chung về task và crack_id từ inspection đầu tiên
      const task = inspections[0].taskAssignment.task;
      let crackInfo = null;

      // Nếu task có crack_id, lấy thông tin crack một lần duy nhất
      if (task && task.crack_id) {
        console.log(`Getting crack info for task_id: ${task.task_id}, crack_id: ${task.crack_id}`)
        try {
          console.log("Trying to get crack info...")
          crackInfo = await firstValueFrom(
            this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
          )
          console.log("✅ Successfully retrieved crack info")

          // Process crack images if they exist
          if (crackInfo && crackInfo.data) {
            const crackData = crackInfo.data

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
        } catch (error) {
          console.error("❌ Failed to get crack info for crack_id:", task.crack_id)
          console.error("Error details:", error)

          // Thử phương án thay thế với định dạng khác
          try {
            console.log("Attempting alternative method to get crack info...")
            crackInfo = await firstValueFrom(
              this.crackClient.send(
                { cmd: 'get-crack-report-by-id' },
                task.crack_id
              )
            )
            console.log("✅ Successfully retrieved crack info with alternative method")
          } catch (fallbackError) {
            console.error("❌ Alternative method also failed:", fallbackError)
            // Optionally set a default or error state
            crackInfo = { error: "Failed to retrieve crack information" }
          }
        }
      }

      // Kết quả sẽ trả về
      const result = [];

      // Xử lý từng inspection
      for (const inspection of inspections) {
        // Tạo bản sao và thêm crackInfo vào
        const inspectionData: any = { ...inspection };

        // Thêm thông tin crack nếu có
        if (crackInfo) {
          inspectionData.crackInfo = crackInfo;
        }

        // Process image URLs
        if (inspectionData.image_urls && inspectionData.image_urls.length > 0) {
          inspectionData.image_urls = await Promise.all(
            inspectionData.image_urls.map(async (url: string) => {
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
        if (inspectionData.uploadFile) {
          try {
            const fileKey = this.extractFileKey(inspectionData.uploadFile)
            inspectionData.uploadFile = await this.getPreSignedUrl(fileKey)
          } catch (error) {
            console.error(`Error getting pre-signed URL for PDF file:`, error)
            // Keep original URL as fallback
          }
        }

        result.push(inspectionData)
      }

      return {
        statusCode: 200,
        message: 'Lấy danh sách báo cáo thành công',
        data: result,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách báo cáo cho nhiệm vụ',
      })
    }
  }

  async updateInspection(inspection_id: string, dto: UpdateInspectionDto) {
    const existingInspection = await this.prisma.inspection.findUnique({
      where: { inspection_id },
    })

    if (!existingInspection) {
      throw new RpcException(
        new ApiResponse(false, 'Báo cáo không tồn tại'),
      )
    }

    try {
      const updatedInspection = await this.prisma.inspection.update({
        where: { inspection_id },
        data: { ...dto },
      })
      return new ApiResponse(true, 'Cập nhật báo cáo thành công', [
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
          message: 'Không tìm thấy báo cáo nào',
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
        message: 'Lấy danh sách báo cáo thành công',
        data: inspections,
        total: inspections.length,
      }
    } catch (error) {
      console.error('Error in GetAllInspections:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách báo cáo',
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
        include: {
          task: true, // Include Task relation
        }
      });

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

      // Get the task and crack_id
      const task = taskAssignment.task;
      const crackId = task.crack_id;

      // Get building information to check warranty status (only if task has a crack_id)
      let isWarrantyExpired = false;
      let buildingDetailId = null;

      if (crackId) {
        try {
          // Get building detail ID from crack report
          const buildingDetailResponse = await firstValueFrom(
            this.crackClient.send(
              { cmd: 'get-buildingDetail-by-crack-id' },
              { crackId }
            ).pipe(
              timeout(10000),
              catchError(err => {
                console.error('Error getting building detail from crack:', err);
                return of({ isSuccess: false, data: null });
              })
            )
          );

          if (buildingDetailResponse && buildingDetailResponse.isSuccess && buildingDetailResponse.data) {
            buildingDetailId = buildingDetailResponse.data.buildingDetailId;

            // Get building information from building service using buildingDetailId
            if (buildingDetailId) {
              const buildingResponse = await firstValueFrom(
                this.buildingsClient.send(
                  { cmd: 'get-building-from-building-detail' },
                  { buildingDetailId }
                ).pipe(
                  timeout(10000),
                  catchError(err => {
                    console.error('Error getting building information:', err);
                    return of({ isSuccess: false, data: null });
                  })
                )
              );

              if (buildingResponse && buildingResponse.isSuccess && buildingResponse.data) {
                const building = buildingResponse.data;

                // Log full building object để debug
                console.log(`Full building object: ${JSON.stringify(building, null, 2)}`);

                // Check if warranty date exists under various possible field names
                const warrantyDate = building.warrantyDate || building.Warranty_date || building.warranty_date;

                if (warrantyDate) {
                  const warrantyDateObj = new Date(warrantyDate);
                  const currentDate = new Date();

                  console.log(`Current date: ${currentDate.toISOString()}`);
                  console.log(`Warranty date: ${warrantyDateObj.toISOString()}`);

                  isWarrantyExpired = warrantyDateObj < currentDate;

                  console.log(`Building warranty check: warrantyDate=${warrantyDateObj.toISOString()}, currentDate=${currentDate.toISOString()}, isExpired=${isWarrantyExpired}`);
                } else {
                  console.log('Building does not have a warranty date (field not found in response), assuming expired');
                  console.log('Available fields in building object: ' + Object.keys(building).join(', '));
                  isWarrantyExpired = true; // If no warranty date, assume expired
                }
              } else {
                console.log('Could not get building information, assuming warranty expired');
                isWarrantyExpired = true; // If can't get building info, assume expired
              }
            }
          } else {
            console.log('Could not get building detail ID from crack, assuming warranty expired');
            isWarrantyExpired = true; // If can't get building detail, assume expired
          }
        } catch (error) {
          console.error('Error checking warranty status:', error);
          // Continue with inspection creation, just log the error
        }
      }

      // Parse repairMaterials if it's a string
      let repairMaterialsArray: RepairMaterialDto[] = [];
      try {
        const repairMaterials = dto.repairMaterials as string | RepairMaterialDto[] | any

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
        } else if (typeof repairMaterials === 'object' && repairMaterials !== null) {
          // Handle the case when it's a single object (not in an array)
          repairMaterialsArray = [repairMaterials];
          console.log('Converting single object to array:', repairMaterialsArray);
        } else {
          throw new Error('Định dạng vật liệu sửa chữa không hợp lệ')
        }

        // Make sure it's always an array at this point
        if (!Array.isArray(repairMaterialsArray)) {
          repairMaterialsArray = Array.isArray(repairMaterialsArray) ? repairMaterialsArray : [repairMaterialsArray];
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

              // Removed: Update material stock (decrement) logic

              return repairMaterial
            })
          )

          return {
            ...inspection,
            repairMaterials,
          }
        })

        // If warranty is expired and we have a crackId, update the crack report status and create worklog
        if (isWarrantyExpired && crackId) {
          try {
            // First get the current crack report status
            console.log(`[DEBUG] Checking crack report status for crackId: ${crackId}`);
            const crackReportResponse = await firstValueFrom(
              this.crackClient.send(
                { cmd: 'get-crack-report-by-id' },
                crackId
              ).pipe(
                catchError(error => {
                  console.error('Error getting crack report details:', error);
                  return of({ isSuccess: false, data: null });
                })
              )
            );

            // Log the entire response to see its structure
            console.log(`[DEBUG] Crack report response:`, JSON.stringify(crackReportResponse, null, 2));

            // Check if we can update the status based on current status
            let currentStatus = null;
            if (crackReportResponse?.data) {
              // Handle case when data is an array
              if (Array.isArray(crackReportResponse.data) && crackReportResponse.data.length > 0) {
                currentStatus = crackReportResponse.data[0].status;
                console.log(`[DEBUG] Found status in data array: ${currentStatus}`);
              } else if (crackReportResponse.data.status) {
                // Direct status in data object
                currentStatus = crackReportResponse.data.status;
                console.log(`[DEBUG] Found direct status in data: ${currentStatus}`);
              } else if (typeof crackReportResponse.data === 'object') {
                // Try to find status in different property of data
                currentStatus = crackReportResponse.data.ReportStatus;
                console.log(`[DEBUG] Tried alternate property (ReportStatus): ${currentStatus}`);
              }
            }

            console.log(`[DEBUG] Extracted current status: ${currentStatus}`);
            const allowedStatusesForUpdate = ['Pending', 'InProgress', 'Reviewing'];

            console.log(`[DEBUG] Checking if ${currentStatus} is in allowed statuses: ${allowedStatusesForUpdate.join(', ')}`);
            console.log(`[DEBUG] Status comparison result: ${allowedStatusesForUpdate.includes(currentStatus)}`);

            // Updated condition with more robust checking
            const shouldUpdateStatus =
              crackReportResponse?.isSuccess &&
              currentStatus &&
              (allowedStatusesForUpdate.includes(currentStatus) ||
                allowedStatusesForUpdate.map(s => s.toLowerCase()).includes(currentStatus.toLowerCase()));

            console.log(`[DEBUG] Should update status: ${shouldUpdateStatus}`);

            if (shouldUpdateStatus) {
              console.log(`[DEBUG] Updating crack report status to WaitingConfirm`);
              // 1. Update CrackReport status to WaitingConfirm
              await firstValueFrom(
                this.crackClient.send(
                  { cmd: 'update-crack-report-for-all-status' },
                  {
                    crackReportId: crackId,
                    dto: { status: 'WaitingConfirm' }
                  }
                ).pipe(
                  catchError(error => {
                    console.error('Error updating crack report status:', error);
                    return of({ isSuccess: false, message: error.message });
                  })
                )
              );

              // 2. Create worklog with WAIT_FOR_DEPOSIT status
              if (task.task_id) {
                console.log(`[DEBUG] Creating worklog for task: ${task.task_id}`);
                await firstValueFrom(
                  this.taskClient.send(
                    WORKLOG_PATTERN.CREATE,
                    {
                      task_id: task.task_id,
                      title: 'Chờ đặt cọc từ cư dân',
                      description: 'Tòa nhà đã hết hạn bảo hành, cần cư dân đặt cọc trước khi tiếp tục',
                      status: 'WAIT_FOR_DEPOSIT'
                    }
                  ).pipe(
                    catchError(error => {
                      console.error('Error creating worklog:', error);
                      return of({ isSuccess: false, message: error.message });
                    })
                  )
                );
                console.log(`[DEBUG] Worklog created successfully`);
              }

              console.log(`Successfully updated statuses due to expired warranty. CrackId: ${crackId}, TaskId: ${task.task_id}`);
            } else {
              console.log(`[DEBUG] Not updating status because current status is not in allowed list or response was not successful`);
            }
          } catch (error) {
            console.error('Error updating statuses after inspection creation:', error);
            // Don't fail the overall operation if this update fails
          }
        }

        return new ApiResponse(
          true,
          'Tạo báo cáo thành công',
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

        // If warranty is expired and we have a crackId, update the crack report status and create worklog
        if (isWarrantyExpired && crackId) {
          try {
            // First get the current crack report status
            console.log(`[DEBUG] Checking crack report status for crackId: ${crackId}`);
            const crackReportResponse = await firstValueFrom(
              this.crackClient.send(
                { cmd: 'get-crack-report-by-id' },
                crackId
              ).pipe(
                catchError(error => {
                  console.error('Error getting crack report details:', error);
                  return of({ isSuccess: false, data: null });
                })
              )
            );

            // Log the entire response to see its structure
            console.log(`[DEBUG] Crack report response:`, JSON.stringify(crackReportResponse, null, 2));

            // Check if we can update the status based on current status
            let currentStatus = null;
            if (crackReportResponse?.data) {
              // Handle case when data is an array
              if (Array.isArray(crackReportResponse.data) && crackReportResponse.data.length > 0) {
                currentStatus = crackReportResponse.data[0].status;
                console.log(`[DEBUG] Found status in data array: ${currentStatus}`);
              } else if (crackReportResponse.data.status) {
                // Direct status in data object
                currentStatus = crackReportResponse.data.status;
                console.log(`[DEBUG] Found direct status in data: ${currentStatus}`);
              } else if (typeof crackReportResponse.data === 'object') {
                // Try to find status in different property of data
                currentStatus = crackReportResponse.data.ReportStatus;
                console.log(`[DEBUG] Tried alternate property (ReportStatus): ${currentStatus}`);
              }
            }

            console.log(`[DEBUG] Extracted current status: ${currentStatus}`);
            const allowedStatusesForUpdate = ['Pending', 'InProgress', 'Reviewing'];

            console.log(`[DEBUG] Checking if ${currentStatus} is in allowed statuses: ${allowedStatusesForUpdate.join(', ')}`);
            console.log(`[DEBUG] Status comparison result: ${allowedStatusesForUpdate.includes(currentStatus)}`);

            // Updated condition with more robust checking
            const shouldUpdateStatus =
              crackReportResponse?.isSuccess &&
              currentStatus &&
              (allowedStatusesForUpdate.includes(currentStatus) ||
                allowedStatusesForUpdate.map(s => s.toLowerCase()).includes(currentStatus.toLowerCase()));

            console.log(`[DEBUG] Should update status: ${shouldUpdateStatus}`);

            if (shouldUpdateStatus) {
              console.log(`[DEBUG] Updating crack report status to WaitingConfirm`);
              // 1. Update CrackReport status to WaitingConfirm
              await firstValueFrom(
                this.crackClient.send(
                  { cmd: 'update-crack-report-for-all-status' },
                  {
                    crackReportId: crackId,
                    dto: { status: 'WaitingConfirm' }
                  }
                ).pipe(
                  catchError(error => {
                    console.error('Error updating crack report status:', error);
                    return of({ isSuccess: false, message: error.message });
                  })
                )
              );

              // 2. Create worklog with WAIT_FOR_DEPOSIT status
              if (task.task_id) {
                console.log(`[DEBUG] Creating worklog for task: ${task.task_id}`);
                await firstValueFrom(
                  this.taskClient.send(
                    WORKLOG_PATTERN.CREATE,
                    {
                      task_id: task.task_id,
                      title: 'Chờ đặt cọc từ cư dân',
                      description: 'Tòa nhà đã hết hạn bảo hành, cần cư dân đặt cọc trước khi tiếp tục',
                      status: 'WAIT_FOR_DEPOSIT'
                    }
                  ).pipe(
                    catchError(error => {
                      console.error('Error creating worklog:', error);
                      return of({ isSuccess: false, message: error.message });
                    })
                  )
                );
                console.log(`[DEBUG] Worklog created successfully`);
              }

              console.log(`Successfully updated statuses due to expired warranty. CrackId: ${crackId}, TaskId: ${task.task_id}`);
            } else {
              console.log(`[DEBUG] Not updating status because current status is not in allowed list or response was not successful`);
            }
          } catch (error) {
            console.error('Error updating statuses after inspection creation:', error);
            // Don't fail the overall operation if this update fails
          }
        }

        return new ApiResponse(
          true,
          'Tạo báo cáo thành công',
          inspection
        )
      }
    } catch (error) {
      console.error('Error in createInspection:', error)
      return new ApiResponse(false, error.message || 'Lỗi khi tạo báo cáo và vật liệu sửa chữa', null)
    }
  }


  async createInspectionActualCost(dto: CreateInspectionDto): Promise<ApiResponse<Inspection>> {
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
        include: {
          task: true, // Include Task relation
        }
      });

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

      // Get the task and crack_id
      const task = taskAssignment.task;
      const crackId = task.crack_id;

      // Get building information to check warranty status (only if task has a crack_id)
      let isWarrantyExpired = false;
      let buildingDetailId = null;

      if (crackId) {
        try {
          // Get building detail ID from crack report
          const buildingDetailResponse = await firstValueFrom(
            this.crackClient.send(
              { cmd: 'get-buildingDetail-by-crack-id' },
              { crackId }
            ).pipe(
              timeout(10000),
              catchError(err => {
                console.error('Error getting building detail from crack:', err);
                return of({ isSuccess: false, data: null });
              })
            )
          );

          if (buildingDetailResponse && buildingDetailResponse.isSuccess && buildingDetailResponse.data) {
            buildingDetailId = buildingDetailResponse.data.buildingDetailId;

            // Get building information from building service using buildingDetailId
            if (buildingDetailId) {
              const buildingResponse = await firstValueFrom(
                this.buildingsClient.send(
                  { cmd: 'get-building-from-building-detail' },
                  { buildingDetailId }
                ).pipe(
                  timeout(10000),
                  catchError(err => {
                    console.error('Error getting building information:', err);
                    return of({ isSuccess: false, data: null });
                  })
                )
              );

              if (buildingResponse && buildingResponse.isSuccess && buildingResponse.data) {
                const building = buildingResponse.data;

                // Log full building object để debug
                console.log(`Full building object: ${JSON.stringify(building, null, 2)}`);

                // Check if warranty date exists under various possible field names
                const warrantyDate = building.warrantyDate || building.Warranty_date || building.warranty_date;

                if (warrantyDate) {
                  const warrantyDateObj = new Date(warrantyDate);
                  const currentDate = new Date();

                  console.log(`Current date: ${currentDate.toISOString()}`);
                  console.log(`Warranty date: ${warrantyDateObj.toISOString()}`);

                  isWarrantyExpired = warrantyDateObj < currentDate;

                  console.log(`Building warranty check: warrantyDate=${warrantyDateObj.toISOString()}, currentDate=${currentDate.toISOString()}, isExpired=${isWarrantyExpired}`);
                } else {
                  console.log('Building does not have a warranty date (field not found in response), assuming expired');
                  console.log('Available fields in building object: ' + Object.keys(building).join(', '));
                  isWarrantyExpired = true; // If no warranty date, assume expired
                }
              } else {
                console.log('Could not get building information, assuming warranty expired');
                isWarrantyExpired = true; // If can't get building info, assume expired
              }
            }
          } else {
            console.log('Could not get building detail ID from crack, assuming warranty expired');
            isWarrantyExpired = true; // If can't get building detail, assume expired
          }
        } catch (error) {
          console.error('Error checking warranty status:', error);
          // Continue with inspection creation, just log the error
        }
      }

      // Parse repairMaterials if it's a string
      let repairMaterialsArray: RepairMaterialDto[] = [];
      try {
        const repairMaterials = dto.repairMaterials as string | RepairMaterialDto[] | any

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
        } else if (typeof repairMaterials === 'object' && repairMaterials !== null) {
          // Handle the case when it's a single object (not in an array)
          repairMaterialsArray = [repairMaterials];
          console.log('Converting single object to array:', repairMaterialsArray);
        } else {
          throw new Error('Định dạng vật liệu sửa chữa không hợp lệ')
        }

        // Make sure it's always an array at this point
        if (!Array.isArray(repairMaterialsArray)) {
          repairMaterialsArray = Array.isArray(repairMaterialsArray) ? repairMaterialsArray : [repairMaterialsArray];
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

        // If warranty is expired and we have a crackId, update the crack report status and create worklog
        if (isWarrantyExpired && crackId) {
          try {
            // First get the current crack report status
            console.log(`[DEBUG] Checking crack report status for crackId: ${crackId}`);
            const crackReportResponse = await firstValueFrom(
              this.crackClient.send(
                { cmd: 'get-crack-report-by-id' },
                crackId
              ).pipe(
                catchError(error => {
                  console.error('Error getting crack report details:', error);
                  return of({ isSuccess: false, data: null });
                })
              )
            );

            // Log the entire response to see its structure
            console.log(`[DEBUG] Crack report response:`, JSON.stringify(crackReportResponse, null, 2));

            // Check if we can update the status based on current status
            let currentStatus = null;
            if (crackReportResponse?.data) {
              // Handle case when data is an array
              if (Array.isArray(crackReportResponse.data) && crackReportResponse.data.length > 0) {
                currentStatus = crackReportResponse.data[0].status;
                console.log(`[DEBUG] Found status in data array: ${currentStatus}`);
              } else if (crackReportResponse.data.status) {
                // Direct status in data object
                currentStatus = crackReportResponse.data.status;
                console.log(`[DEBUG] Found direct status in data: ${currentStatus}`);
              } else if (typeof crackReportResponse.data === 'object') {
                // Try to find status in different property of data
                currentStatus = crackReportResponse.data.ReportStatus;
                console.log(`[DEBUG] Tried alternate property (ReportStatus): ${currentStatus}`);
              }
            }

            console.log(`[DEBUG] Extracted current status: ${currentStatus}`);
            const allowedStatusesForUpdate = ['Pending', 'InProgress', 'Reviewing'];

            console.log(`[DEBUG] Checking if ${currentStatus} is in allowed statuses: ${allowedStatusesForUpdate.join(', ')}`);
            console.log(`[DEBUG] Status comparison result: ${allowedStatusesForUpdate.includes(currentStatus)}`);

            // Updated condition with more robust checking
            const shouldUpdateStatus =
              crackReportResponse?.isSuccess &&
              currentStatus &&
              (allowedStatusesForUpdate.includes(currentStatus) ||
                allowedStatusesForUpdate.map(s => s.toLowerCase()).includes(currentStatus.toLowerCase()));

            console.log(`[DEBUG] Should update status: ${shouldUpdateStatus}`);

            if (shouldUpdateStatus) {
              console.log(`[DEBUG] Updating crack report status to WaitingConfirm`);
              // 1. Update CrackReport status to WaitingConfirm
              await firstValueFrom(
                this.crackClient.send(
                  { cmd: 'update-crack-report-for-all-status' },
                  {
                    crackReportId: crackId,
                    dto: { status: 'WaitingConfirm' }
                  }
                ).pipe(
                  catchError(error => {
                    console.error('Error updating crack report status:', error);
                    return of({ isSuccess: false, message: error.message });
                  })
                )
              );

              // 2. Create worklog with WAIT_FOR_DEPOSIT status
              if (task.task_id) {
                console.log(`[DEBUG] Creating worklog for task: ${task.task_id}`);
                await firstValueFrom(
                  this.taskClient.send(
                    WORKLOG_PATTERN.CREATE,
                    {
                      task_id: task.task_id,
                      title: 'Chờ đặt cọc từ cư dân',
                      description: 'Tòa nhà đã hết hạn bảo hành, cần cư dân đặt cọc trước khi tiếp tục',
                      status: 'WAIT_FOR_DEPOSIT'
                    }
                  ).pipe(
                    catchError(error => {
                      console.error('Error creating worklog:', error);
                      return of({ isSuccess: false, message: error.message });
                    })
                  )
                );
                console.log(`[DEBUG] Worklog created successfully`);
              }

              console.log(`Successfully updated statuses due to expired warranty. CrackId: ${crackId}, TaskId: ${task.task_id}`);
            } else {
              console.log(`[DEBUG] Not updating status because current status is not in allowed list or response was not successful`);
            }
          } catch (error) {
            console.error('Error updating statuses after inspection creation:', error);
            // Don't fail the overall operation if this update fails
          }
        }

        // Call COMPLETE_AND_REVIEW to update task status
        try {
          const taskId = task.task_id;
          console.log(`[InspectionService] Calling COMPLETE_AND_REVIEW pattern for task: ${taskId}`);

          await firstValueFrom(
            this.taskClient.send(
              TASKS_PATTERN.COMPLETE_AND_REVIEW,
              { taskId }
            ).pipe(
              timeout(10000),
              catchError(error => {
                console.error(`[InspectionService] Error calling COMPLETE_AND_REVIEW: ${error.message}`);
                return of({ isSuccess: false, message: error.message });
              })
            )
          );

          console.log(`[InspectionService] Successfully called COMPLETE_AND_REVIEW for task: ${taskId}`);
        } catch (error) {
          console.error(`[InspectionService] Failed to call COMPLETE_AND_REVIEW: ${error.message}`);
          // Continue with the process even if this update fails
        }

        return new ApiResponse(
          true,
          'Tạo báo cáo thành công',
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

        // If warranty is expired and we have a crackId, update the crack report status and create worklog
        if (isWarrantyExpired && crackId) {
          try {
            // First get the current crack report status
            console.log(`[DEBUG] Checking crack report status for crackId: ${crackId}`);
            const crackReportResponse = await firstValueFrom(
              this.crackClient.send(
                { cmd: 'get-crack-report-by-id' },
                crackId
              ).pipe(
                catchError(error => {
                  console.error('Error getting crack report details:', error);
                  return of({ isSuccess: false, data: null });
                })
              )
            );

            // Log the entire response to see its structure
            console.log(`[DEBUG] Crack report response:`, JSON.stringify(crackReportResponse, null, 2));

            // Check if we can update the status based on current status
            let currentStatus = null;
            if (crackReportResponse?.data) {
              // Handle case when data is an array
              if (Array.isArray(crackReportResponse.data) && crackReportResponse.data.length > 0) {
                currentStatus = crackReportResponse.data[0].status;
                console.log(`[DEBUG] Found status in data array: ${currentStatus}`);
              } else if (crackReportResponse.data.status) {
                // Direct status in data object
                currentStatus = crackReportResponse.data.status;
                console.log(`[DEBUG] Found direct status in data: ${currentStatus}`);
              } else if (typeof crackReportResponse.data === 'object') {
                // Try to find status in different property of data
                currentStatus = crackReportResponse.data.ReportStatus;
                console.log(`[DEBUG] Tried alternate property (ReportStatus): ${currentStatus}`);
              }
            }

            console.log(`[DEBUG] Extracted current status: ${currentStatus}`);
            const allowedStatusesForUpdate = ['Pending', 'InProgress', 'Reviewing'];

            console.log(`[DEBUG] Checking if ${currentStatus} is in allowed statuses: ${allowedStatusesForUpdate.join(', ')}`);
            console.log(`[DEBUG] Status comparison result: ${allowedStatusesForUpdate.includes(currentStatus)}`);

            // Updated condition with more robust checking
            const shouldUpdateStatus =
              crackReportResponse?.isSuccess &&
              currentStatus &&
              (allowedStatusesForUpdate.includes(currentStatus) ||
                allowedStatusesForUpdate.map(s => s.toLowerCase()).includes(currentStatus.toLowerCase()));

            console.log(`[DEBUG] Should update status: ${shouldUpdateStatus}`);

            if (shouldUpdateStatus) {
              console.log(`[DEBUG] Updating crack report status to WaitingConfirm`);
              // 1. Update CrackReport status to WaitingConfirm
              await firstValueFrom(
                this.crackClient.send(
                  { cmd: 'update-crack-report-for-all-status' },
                  {
                    crackReportId: crackId,
                    dto: { status: 'WaitingConfirm' }
                  }
                ).pipe(
                  catchError(error => {
                    console.error('Error updating crack report status:', error);
                    return of({ isSuccess: false, message: error.message });
                  })
                )
              );

              // 2. Create worklog with WAIT_FOR_DEPOSIT status
              if (task.task_id) {
                console.log(`[DEBUG] Creating worklog for task: ${task.task_id}`);
                await firstValueFrom(
                  this.taskClient.send(
                    WORKLOG_PATTERN.CREATE,
                    {
                      task_id: task.task_id,
                      title: 'Chờ đặt cọc từ cư dân',
                      description: 'Tòa nhà đã hết hạn bảo hành, cần cư dân đặt cọc trước khi tiếp tục',
                      status: 'WAIT_FOR_DEPOSIT'
                    }
                  ).pipe(
                    catchError(error => {
                      console.error('Error creating worklog:', error);
                      return of({ isSuccess: false, message: error.message });
                    })
                  )
                );
                console.log(`[DEBUG] Worklog created successfully`);
              }

              console.log(`Successfully updated statuses due to expired warranty. CrackId: ${crackId}, TaskId: ${task.task_id}`);
            } else {
              console.log(`[DEBUG] Not updating status because current status is not in allowed list or response was not successful`);
            }
          } catch (error) {
            console.error('Error updating statuses after inspection creation:', error);
            // Don't fail the overall operation if this update fails
          }
        }

        // Call COMPLETE_AND_REVIEW to update task status
        try {
          const taskId = task.task_id;
          console.log(`[InspectionService] Calling COMPLETE_AND_REVIEW pattern for task: ${taskId}`);

          await firstValueFrom(
            this.taskClient.send(
              TASKS_PATTERN.COMPLETE_AND_REVIEW,
              { taskId }
            ).pipe(
              timeout(10000),
              catchError(error => {
                console.error(`[InspectionService] Error calling COMPLETE_AND_REVIEW: ${error.message}`);
                return of({ isSuccess: false, message: error.message });
              })
            )
          );

          console.log(`[InspectionService] Successfully called COMPLETE_AND_REVIEW for task: ${taskId}`);
        } catch (error) {
          console.error(`[InspectionService] Failed to call COMPLETE_AND_REVIEW: ${error.message}`);
          // Continue with the process even if this update fails
        }

        return new ApiResponse(
          true,
          'Tạo báo cáo thành công',
          inspection
        )
      }
    } catch (error) {
      console.error('Error in createInspection:', error)
      return new ApiResponse(false, error.message || 'Lỗi khi tạo báo cáo và vật liệu sửa chữa', null)
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
        return new ApiResponse(false, 'Không tìm thấy báo cáo', null)
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
        return new ApiResponse(false, 'Không tìm thấy báo cáo', null)
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
        try {
          console.log("Trying to get crack info...")
          const crackInfo = await firstValueFrom(
            this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
          )
          result.crackInfo = crackInfo
          console.log("✅ Successfully retrieved crack info:")
          console.log("🚀 ~ InspectionsService ~ getInspectionDetails ~ crackInfo:", crackInfo)
        } catch (error) {
          console.error("❌ Failed to get crack info for crack_id:", task.crack_id)
          console.error("Error details:", error)

          // Thử phương án thay thế với định dạng khác
          try {
            console.log("Attempting alternative method to get crack info...")
            const crackInfo = await firstValueFrom(
              this.crackClient.send(
                { cmd: 'get-crack-report-by-id' },
                task.crack_id
              )
            )
            result.crackInfo = crackInfo
            console.log("✅ Successfully retrieved crack info with alternative method")
          } catch (fallbackError) {
            console.error("❌ Alternative method also failed:", fallbackError)
            // Optionally set a default or error state
            result.crackInfo = { error: "Failed to retrieve crack information" }
          }
        }

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

      return new ApiResponse(true, 'Lấy chi tiết báo cáo thành công', result)
    } catch (error) {
      return new ApiResponse(false, 'Lỗi khi lấy chi tiết báo cáo', error.message)
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
        return new ApiResponse(false, 'Không tìm thấy báo cáo', null)
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

      return new ApiResponse(true, 'Lấy thông tin báo cáo thành công', inspection)
    } catch (error) {
      console.error('Error retrieving inspection:', error)
      return new ApiResponse(false, 'Lỗi khi lấy thông tin báo cáo', error.message)
    }
  }

  async getBuildingAreaFromSchedule(schedule_job_id: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(`Getting building area for schedule job ID: ${schedule_job_id}`);

      // Kiểm tra schedule_job_id
      if (!schedule_job_id) {
        this.logger.error(`Invalid schedule_job_id provided: ${schedule_job_id}`);
        return new ApiResponse(false, 'ID lịch trình công việc không hợp lệ', null);
      }

      // Import AREAS_PATTERN để sử dụng pattern chuẩn
      const { AREAS_PATTERN } = require('@app/contracts/Areas/Areas.patterns');
      const { BUILDINGDETAIL_PATTERN } = require('@app/contracts/BuildingDetails/buildingdetails.patterns');

      // Khai báo biến
      let buildingDetailId;
      let buildingId;
      let scheduleJob;

      try {
        // Thay vì gọi qua service, kết nối trực tiếp đến database
        this.logger.log(`Attempting to query schedule job directly from database`);

        // Tạo PrismaClient mới cho Schedule database
        const schedulePrisma = new SchedulePrismaClient({
          datasources: {
            db: {
              url: process.env.DB_SCHEDULE_SERVICE
            }
          }
        });

        try {
          // Truy vấn schedulejob từ database
          scheduleJob = await schedulePrisma.scheduleJob.findUnique({
            where: { schedule_job_id },
            include: { schedule: true }
          });

          // Đóng kết nối database
          await schedulePrisma.$disconnect();

          if (!scheduleJob) {
            this.logger.error(`No schedule job found in database with ID: ${schedule_job_id}`);
            return new ApiResponse(false, 'Không tìm thấy lịch trình công việc trong cơ sở dữ liệu', null);
          }

          this.logger.log(`Schedule job found in database: ${JSON.stringify(scheduleJob)}`);

          // Lấy buildingDetailId
          buildingDetailId = scheduleJob.buildingDetailId;

          if (!buildingDetailId) {
            this.logger.error(`No buildingDetailId found in schedule job data: ${JSON.stringify(scheduleJob)}`);
            return new ApiResponse(false, 'Không tìm thấy ID chi tiết tòa nhà trong lịch trình', null);
          }

          this.logger.log(`Found buildingDetailId: ${buildingDetailId} for schedule job: ${schedule_job_id}`);
        } catch (dbError) {
          // Đảm bảo đóng kết nối database nếu có lỗi
          await schedulePrisma.$disconnect();
          this.logger.error(`Database error: ${dbError?.message || 'Unknown error'}`, dbError?.stack);
          throw new Error(`Lỗi truy vấn cơ sở dữ liệu: ${dbError?.message || 'Unknown error'}`);
        }
      } catch (error) {
        this.logger.error(`Error querying schedule job: ${error?.message || 'Unknown error'}`, error?.stack);
        return new ApiResponse(false, `Lỗi khi truy vấn lịch trình công việc: ${error?.message || 'Unknown error'}`, null);
      }

      // Step 1: Get buildingDetail info using buildingDetailId
      this.logger.log(`Getting buildingDetail with ID: ${buildingDetailId}`);
      const buildingDetailResponse = await firstValueFrom(
        this.buildingsClient.send(
          BUILDINGDETAIL_PATTERN.GET_BY_ID,
          { buildingDetailId }
        ).pipe(
          timeout(15000),
          catchError(err => {
            this.logger.error(`Error getting building detail: ${err?.message || 'Unknown error'}`, err?.stack);
            return of(new ApiResponse(false, `Lỗi khi lấy thông tin chi tiết tòa nhà: ${err?.message || 'Unknown error'}`, null));
          })
        )
      );

      this.logger.log(`Building detail response received: ${JSON.stringify(buildingDetailResponse || {})}`);

      // Nếu nhận được phản hồi thành công, có thể trích xuất areaId trực tiếp
      if (buildingDetailResponse &&
        buildingDetailResponse.statusCode === 200 &&
        buildingDetailResponse.data &&
        buildingDetailResponse.data.building &&
        buildingDetailResponse.data.building.area) {

        // Trích xuất thông tin từ buildingDetail
        buildingId = buildingDetailResponse.data.buildingId;
        const areaId = buildingDetailResponse.data.building.area.areaId;
        const areaName = buildingDetailResponse.data.building.area.name;

        this.logger.log(`Đã trích xuất thông tin khu vực thành công từ phản hồi buildingDetail: areaId=${areaId}, areaName=${areaName}`);

        // Trả về thông tin khu vực trực tiếp
        return new ApiResponse(true, 'Lấy thông tin khu vực tòa nhà thành công',
          buildingDetailResponse.data.building.area
        );
      }

      // Nếu không nhận được thông tin trực tiếp, tiếp tục quy trình ban đầu
      if (!buildingDetailResponse ||
        (buildingDetailResponse.statusCode && buildingDetailResponse.statusCode !== 200) ||
        !buildingDetailResponse.data) {
        this.logger.error(`Failed to get building detail: ${buildingDetailResponse?.message || 'Unknown error'}`);

        // Thử phương án thứ 2: Truy vấn trực tiếp từ dữ liệu scheduleJob
        if (scheduleJob && scheduleJob.buildingDetailId) {
          buildingId = scheduleJob.buildingDetailId;
          this.logger.log(`Using buildingDetailId as fallback: ${buildingId}`);
        } else {
          return new ApiResponse(false, buildingDetailResponse?.message || 'Không thể lấy thông tin chi tiết tòa nhà', null);
        }
      } else {
        // Lấy buildingId từ buildingDetail
        buildingId = buildingDetailResponse.data.buildingId;
        this.logger.log(`Retrieved buildingId: ${buildingId} from buildingDetail`);
      }

      // Step 2: Get building info with area using buildingId
      this.logger.log(`Getting building info with ID: ${buildingId}`);
      const buildingResponse = await firstValueFrom(
        this.buildingsClient.send(
          BUILDINGS_PATTERN.GET_BY_ID,
          { buildingId }
        ).pipe(
          timeout(15000),
          catchError(err => {
            this.logger.error(`Error getting building info: ${err?.message || 'Unknown error'}`, err?.stack);
            return of(new ApiResponse(false, `Lỗi khi lấy thông tin tòa nhà: ${err?.message || 'Unknown error'}`, null));
          })
        )
      );

      this.logger.log(`Building response received: ${JSON.stringify(buildingResponse || {})}`);

      if (!buildingResponse ||
        (buildingResponse.statusCode && buildingResponse.statusCode !== 200) ||
        !buildingResponse.data) {
        this.logger.error(`Failed to get building info: ${buildingResponse?.message || 'Unknown error'}`);
        return new ApiResponse(false, buildingResponse?.message || 'Không thể lấy thông tin tòa nhà', null);
      }

      // Lấy area từ thông tin building
      const areaId = buildingResponse.data.area?.areaId || buildingResponse.data.areaId;

      if (!areaId) {
        this.logger.error(`No areaId found in building data: ${JSON.stringify(buildingResponse.data)}`);
        return new ApiResponse(false, 'Không tìm thấy ID khu vực trong thông tin tòa nhà', null);
      }

      this.logger.log(`Found areaId: ${areaId} for buildingId: ${buildingId}`);

      // Step 3: Get area information
      this.logger.log(`Getting area info for areaId: ${areaId} using pattern: ${AREAS_PATTERN.GET_BY_ID}`);
      const areaResponse = await firstValueFrom(
        this.buildingsClient.send(
          AREAS_PATTERN.GET_BY_ID,
          { areaId }
        ).pipe(
          timeout(15000),
          catchError(err => {
            this.logger.error(`Error getting area info: ${err?.message || 'Unknown error'}`, err?.stack);
            return of(new ApiResponse(false, `Lỗi khi lấy thông tin khu vực: ${err?.message || 'Unknown error'}`, null));
          })
        )
      );

      this.logger.log(`Area response received: ${JSON.stringify(areaResponse || {})}`);

      if (!areaResponse || !areaResponse.data) {
        this.logger.error(`No response received for area ID: ${areaId}`);
        return new ApiResponse(false, 'Không nhận được phản hồi từ dịch vụ khu vực', null);
      }

      this.logger.log(`Successfully retrieved area for schedule job: ${schedule_job_id}`);
      return new ApiResponse(true, 'Lấy thông tin khu vực tòa nhà thành công', areaResponse.data);
    } catch (error) {
      this.logger.error(`Error in getBuildingAreaFromSchedule: ${error?.message || 'Unknown error'}`, error?.stack);
      return new ApiResponse(false, `Lỗi khi lấy thông tin khu vực từ lịch trình: ${error?.message || 'Unknown error'}`, null);
    }
  }

  async getBuildingDetailIdFromTaskAssignment(task_assignment_id: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(`Finding task assignment with ID: ${task_assignment_id}`);

      // First find the TaskAssignment
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: task_assignment_id },
        include: {
          task: true, // Include Task relation
        },
      });

      this.logger.log('Task assignment found:', JSON.stringify(taskAssignment, null, 2));

      if (!taskAssignment || !taskAssignment.task) {
        this.logger.error('TaskAssignment or Task not found:', task_assignment_id);
        return new ApiResponse(false, 'Không tìm thấy nhiệm vụ được phân công hoặc nhiệm vụ', null);
      }

      // Use the task_id to get the BuildingDetailId from Crack service
      const taskId = taskAssignment.task.task_id;
      this.logger.log(`Using task_id: ${taskId} to get buildingDetailId`);
      this.logger.log(`Task details: crack_id=${taskAssignment.task.crack_id}`);

      // Call the CRACK service to get buildingDetailId using task_id
      this.logger.log(`Calling crack service with task_id=${taskId}`);
      const crackResponse = await firstValueFrom(
        this.crackClient.send(
          { cmd: 'get-buildingDetail-by-task-id' },
          { taskId }
        ).pipe(
          timeout(10000),
          catchError(err => {
            this.logger.error('Error getting building detail by task ID:', err);
            return of({ isSuccess: false, data: null });
          })
        )
      );

      this.logger.log('Crack service response:', JSON.stringify(crackResponse, null, 2));

      if (!crackResponse || !crackResponse.isSuccess || !crackResponse.data) {
        this.logger.error('Failed to get building detail from crack service');
        return new ApiResponse(false, 'Không thể lấy thông tin tòa nhà', null);
      }

      // Extract buildingDetailId from the response
      const buildingDetailId = crackResponse.data.buildingDetailId;

      if (!buildingDetailId) {
        this.logger.error('BuildingDetailId not found in crack response');
        return new ApiResponse(false, 'Không tìm thấy ID chi tiết tòa nhà', null);
      }

      this.logger.log('Successfully retrieved buildingDetailId:', buildingDetailId);
      return new ApiResponse(true, 'Lấy ID chi tiết tòa nhà thành công', { buildingDetailId });
    } catch (error) {
      this.logger.error('Error in getBuildingDetailIdFromTaskAssignment:', error);
      return new ApiResponse(false, 'Lỗi khi lấy ID chi tiết tòa nhà', null);
    }
  }

  async verifyLeaderAndArea(employee_id: string, task_id: string): Promise<ApiResponse<any>> {
    try {
      // Check if userService is initialized
      if (!this.userService) {
        this.logger.error(`userService is not initialized. Cannot verify leader role.`);
        return new ApiResponse(false, 'Dịch vụ người dùng chưa sẵn sàng. Vui lòng thử lại sau.', null);
      }

      this.logger.log(`Verifying leader role for employee: ${employee_id}, task: ${task_id}`);

      // 1. Get user info to check if they're a leader
      let userInfo;
      try {
        this.logger.log(`Calling getUserInfo for employee: ${employee_id}`);
        userInfo = await firstValueFrom(
          this.userService.getUserInfo({ userId: employee_id, username: '' })
            .pipe(
              timeout(10000),
              catchError(err => {
                this.logger.error(`Error getting user info: ${err.message}`, err.stack);
                return of(null);
              })
            )
        );
        this.logger.log(`getUserInfo result received: ${userInfo ? 'Success' : 'Null'}`);

        if (userInfo) {
          this.logger.log(`User details: positionId=${userInfo.positionId}, departmentId=${userInfo.departmentId}`);
        }
      } catch (error) {
        this.logger.error(`Critical error calling getUserInfo: ${error.message}`, error.stack);
        return new ApiResponse(false, `Lỗi khi truy vấn thông tin người dùng: ${error.message}`, null);
      }

      if (!userInfo) {
        return new ApiResponse(false, 'Không tìm thấy thông tin của nhân viên', null);
      }

      // 2. Check if user has a position and it's a Leader
      let isLeader = false;
      if (userInfo.userDetails && userInfo.userDetails.positionId) {
        const positionId = userInfo.userDetails.positionId;
        this.logger.log(`Found positionId: ${positionId} for employee: ${employee_id}`);

        try {
          this.logger.log(`Calling getWorkingPositionById for positionId: ${positionId}`);
          const positionResponse = await firstValueFrom(
            this.userService.getWorkingPositionById({ positionId })
              .pipe(
                timeout(10000),
                catchError(err => {
                  this.logger.error(`Error getting position info: ${err.message}`, err.stack);
                  return of(null);
                })
              )
          );

          this.logger.log(`getWorkingPositionById result: ${JSON.stringify(positionResponse || {})}`);

          if (!positionResponse) {
            return new ApiResponse(false, 'Không tìm thấy thông tin vị trí của nhân viên', null);
          }

          if (positionResponse.isSuccess && positionResponse.data) {
            const posName = positionResponse.data.positionName;
            this.logger.log(`Position name: ${posName}`);
            isLeader = posName === 'Leader';
          } else {
            this.logger.error(`Error response from position service: ${positionResponse.message || 'Unknown error'}`);
            return new ApiResponse(false, positionResponse.message || 'Lỗi khi truy vấn thông tin vị trí', null);
          }
        } catch (error) {
          this.logger.error(`Error getting position information: ${error.message}`, error.stack);
          return new ApiResponse(false, `Lỗi khi truy vấn thông tin vị trí: ${error.message}`, null);
        }
      } else if (userInfo.userDetails && userInfo.userDetails.position) {
        // Position already included in userInfo response
        const position = userInfo.userDetails.position;
        this.logger.log(`Position information already in userInfo: ${JSON.stringify(position)}`);
        isLeader = position.positionName === 'Leader';
      } else {
        this.logger.error(`No position information found for employee: ${employee_id}`);
        return new ApiResponse(false, 'Nhân viên chưa được gán vị trí công việc', null);
      }

      if (!isLeader) {
        return new ApiResponse(false, 'Nhân viên phải có vị trí là Leader', null);
      }

      // 3. Get user's department area
      let departmentArea;
      if (userInfo.userDetails && userInfo.userDetails.departmentId) {
        try {
          // Try using userService first (if getDepartmentById is implemented in gRPC)
          if (this.userService && typeof this.userService.getDepartmentById === 'function') {
            const departmentResponse = await firstValueFrom(
              this.userService.getDepartmentById({ departmentId: userInfo.userDetails.departmentId })
                .pipe(
                  timeout(10000),
                  catchError(err => {
                    this.logger.error(`Error getting department info via gRPC: ${err.message}`, err.stack);
                    return of(null);
                  })
                )
            );

            if (departmentResponse) {
              departmentArea = departmentResponse.area;
              this.logger.log(`Retrieved department area via gRPC: ${departmentArea}`);
            }
          }

          // Fallback: If userService.getDepartmentById isn't available or returned null,
          // try using task client (which is ClientProxy, not gRPC)
          if (!departmentArea) {
            this.logger.log(`Trying alternative department retrieval method via gRPC`);
            const departmentResponse = await firstValueFrom(
              this.userService.getDepartmentById({ departmentId: userInfo.userDetails.departmentId })
                .pipe(
                  timeout(10000),
                  catchError(err => {
                    this.logger.error(`Error getting department info via gRPC: ${err.message}`, err.stack);
                    return of({ isSuccess: false, data: null });
                  })
                )
            );

            if (departmentResponse?.isSuccess && departmentResponse?.data) {
              departmentArea = departmentResponse.data.area;
              this.logger.log(`Retrieved department area via gRPC: ${departmentArea}`);
            }
          }
        } catch (error) {
          this.logger.error(`Error getting department area: ${error.message}`, error.stack);
          return new ApiResponse(false, 'Lỗi khi lấy thông tin khu vực phòng ban', null);
        }
      } else if (userInfo.userDetails && userInfo.userDetails.department && userInfo.userDetails.department.area) {
        // If department info is already in userInfo response
        departmentArea = userInfo.userDetails.department.area;
        this.logger.log(`Department area found directly in userInfo: ${departmentArea}`);
      }

      if (!departmentArea) {
        return new ApiResponse(false, 'Nhân viên không có thông tin khu vực', null);
      }

      // 4. Get task info to find crack_id or schedule_job_id
      const task = await this.prisma.task.findUnique({
        where: { task_id }
      });

      if (!task) {
        return new ApiResponse(false, 'Không tìm thấy nhiệm vụ', null);
      }

      // 5. Get building area based on crack_id or schedule_job_id
      let buildingAreaResponse;
      if (task.crack_id) {
        // Get area from crack
        try {
          // Use the correct message pattern format
          this.logger.log(`Getting building area from crack with ID: ${task.crack_id}`);

          buildingAreaResponse = await firstValueFrom(
            this.crackClient.send(
              { cmd: 'get-building-area-from-crack' },
              { crack_id: task.crack_id }
            ).pipe(
              timeout(10000),
              catchError(err => {
                this.logger.error(`Error getting building area from crack: ${err.message}`, err.stack);
                return of({ isSuccess: false, data: null, message: `Lỗi khi lấy thông tin khu vực từ vết nứt: ${err.message}` });
              })
            )
          );
        } catch (error) {
          this.logger.error(`Critical error calling crack service: ${error.message}`, error.stack);
          return new ApiResponse(false, `Lỗi khi gọi dịch vụ vết nứt: ${error.message}`, null);
        }
      } else if (task.schedule_job_id) {
        // Get area from schedule job using our own method
        try {
          this.logger.log(`Getting building area from schedule job with ID: ${task.schedule_job_id}`);
          buildingAreaResponse = await this.getBuildingAreaFromSchedule(task.schedule_job_id);
          this.logger.log(`Building area response from schedule: ${JSON.stringify(buildingAreaResponse || {})}`);
        } catch (error) {
          this.logger.error(`Error getting building area from schedule: ${error.message}`, error.stack);
          return new ApiResponse(false, `Lỗi khi lấy thông tin khu vực từ lịch trình: ${error.message}`, null);
        }
      } else {
        return new ApiResponse(false, 'Nhiệm vụ không có thông tin vết nứt hoặc lịch trình', null);
      }

      if (!buildingAreaResponse || !buildingAreaResponse.isSuccess || !buildingAreaResponse.data) {
        const errorMessage = buildingAreaResponse?.message || 'Không thể lấy thông tin khu vực của tòa nhà';
        return new ApiResponse(false, errorMessage, null);
      }

      // 6. Compare areas
      const buildingArea = buildingAreaResponse.data.name;

      if (!buildingArea) {
        return new ApiResponse(false, 'Không tìm thấy thông tin khu vực trong dữ liệu tòa nhà', null);
      }

      if (buildingArea !== departmentArea) {
        return new ApiResponse(
          false,
          `Khu vực không khớp. Khu vực của trưởng nhóm: ${departmentArea}, Khu vực của tòa nhà: ${buildingArea}`,
          null
        );
      }

      // All checks pass
      return new ApiResponse(
        true,
        'Xác thực trưởng nhóm và khu vực thành công',
        { isLeader: true, departmentArea, buildingArea }
      );
    } catch (error) {
      this.logger.error(`Error in verifyLeaderAndArea: ${error.message}`, error.stack);
      return new ApiResponse(false, `Lỗi khi xác thực trưởng nhóm và khu vực: ${error.message}`, null);
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
          `Chỉ nhân viên mới có thể tạo báo cáo. Vai trò hiện tại: ${role}`,
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
          message: 'Không tìm thấy báo cáo',
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
        'Cập nhật trạng thái tài sản riêng của báo cáo thành công',
        updatedInspection
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: `Không thể cập nhật trạng thái tài sản riêng của báo cáo: ${error.message}`,
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
          message: 'Không tìm thấy báo cáo',
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
        'Cập nhật trạng thái báo cáo thành công',
        updatedInspection
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: `Không thể cập nhật trạng thái báo cáo: ${error.message}`,
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
          message: 'Không tìm thấy báo cáo',
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
        'Cập nhật trạng thái báo cáo thành công',
        updatedInspection
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: `Không thể cập nhật trạng thái báo cáo: ${error.message}`,
      });
    }
  }

  async getTaskAssignmentDetails(task_assignment_id: string): Promise<ApiResponse<any>> {
    try {
      // Find the task assignment and include the task
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: {
          assignment_id: task_assignment_id
        },
        include: {
          task: true
        }
      });

      if (!taskAssignment) {
        return new ApiResponse(false, 'Không tìm thấy nhiệm vụ được gán', null);
      }

      return new ApiResponse(true, 'Lấy chi tiết nhiệm vụ được gán thành công', taskAssignment);
    } catch (error) {
      this.logger.error(`Error in getTaskAssignmentDetails: ${error.message}`, error.stack);
      return new ApiResponse(false, `Lỗi khi lấy chi tiết nhiệm vụ được gán: ${error.message}`, null);
    }
  }

  async getInspectionPdfByTaskAssignment(task_assignment_id: string): Promise<ApiResponse<any>> {
    try {
      // Find all inspections for this task assignment
      const inspections = await this.prisma.inspection.findMany({
        where: {
          task_assignment_id: task_assignment_id
        },
        orderBy: {
          created_at: 'desc'
        },
        select: {
          inspection_id: true,
          uploadFile: true
        }
      });

      if (inspections.length === 0) {
        return new ApiResponse(false, 'Không tìm thấy báo cáo cho nhiệm vụ được gán này', null);
      }

      // Process each inspection to add pre-signed URLs
      const processedInspections = await Promise.all(
        inspections.map(async (inspection) => {
          if (inspection.uploadFile) {
            try {
              const fileKey = this.extractFileKey(inspection.uploadFile);
              // Get view URL (no content-disposition)
              const viewUrl = await this.getPreSignedUrl(fileKey);
              // Get download URL (with content-disposition: attachment)
              const downloadUrl = await this.getPreSignedDownloadUrl(fileKey);

              return {
                ...inspection,
                downloadUrl,
                viewUrl
              };
            } catch (error) {
              this.logger.error(`Error getting pre-signed URL for ${inspection.uploadFile}:`, error);
              // Return the inspection without downloadUrl if there's an error
              return inspection;
            }
          }
          return inspection;
        })
      );

      return new ApiResponse(true, 'Lấy tệp PDF báo cáo thành công', processedInspections);
    } catch (error) {
      this.logger.error(`Error in getInspectionPdfByTaskAssignment: ${error.message}`, error.stack);
      return new ApiResponse(false, `Lỗi khi lấy tệp PDF báo cáo: ${error.message}`, null);
    }
  }
}
