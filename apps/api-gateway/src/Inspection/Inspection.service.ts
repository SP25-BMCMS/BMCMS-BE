import {
  Body,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Param,
} from '@nestjs/common'
import { ClientGrpc, ClientProxy } from '@nestjs/microservices'
import { TASK_CLIENT, USERS_CLIENT, CRACK_CLIENT, BUILDING_CLIENT } from '../constraints'
import { catchError, firstValueFrom, of, timeout } from 'rxjs'
import { INSPECTIONS_PATTERN } from '@app/contracts/inspections/inspection.patterns'
import { UpdateInspectionDto } from 'libs/contracts/src/inspections/update-inspection.dto'
import { CreateInspectionDto } from '@app/contracts/inspections/create-inspection.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { Inspection } from '@prisma/client-Task'
import { ChangeInspectionStatusDto } from '@app/contracts/inspections/change-inspection-status.dto'
import { AddImageToInspectionDto } from '@app/contracts/inspections/add-image.dto'
import { UserInterface } from '../users/user/users.interface'
import { LOCATIONDETAIL_PATTERN } from 'libs/contracts/src/LocationDetails/Locationdetails.patterns'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class InspectionService implements OnModuleInit {
  private userService: UserInterface
  private s3: S3Client
  private bucketName: string

  constructor(
    @Inject(TASK_CLIENT) private readonly inspectionClient: ClientProxy,
    @Inject(USERS_CLIENT) private readonly userClient: ClientGrpc,
    @Inject(CRACK_CLIENT) private readonly crackClient: ClientProxy,
    @Inject(BUILDING_CLIENT) private readonly buildingClient: ClientProxy,
    private configService: ConfigService,
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
    // Initialize the gRPC service
    this.userService = this.userClient.getService<UserInterface>('UserService')
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

    return getSignedUrl(this.s3, command, { expiresIn: 3600 }) // URL expires after 1 hour
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
      return this.inspectionClient.send(
        INSPECTIONS_PATTERN.GET_BY_ID_Task_Assignment,
        {
          task_assignment_id,
        },
      )
    } catch (error) {
      throw new HttpException(
        'Inspection not found with the given task assignment ID = ' +
        task_assignment_id,
        HttpStatus.NOT_FOUND,
      )
    }
  }

  async updateInspection(
    @Param('id') inspection_id: string,
    @Body() dto: UpdateInspectionDto,
  ) {
    return firstValueFrom(
      this.inspectionClient
        .send(INSPECTIONS_PATTERN.UPDATE, { inspection_id, dto })
        .pipe(
          catchError((err) => {
            throw new NotFoundException(err.message)
          }),
        ),
    )
  }

  async GetInspectionByCrackId(crack_id: string) {
    try {
      return this.inspectionClient.send(INSPECTIONS_PATTERN.GET_BY_CRACK_ID, {
        crack_id,
      })
    } catch (error) {
      throw new HttpException(
        'Inspection not found with the given crack ID = ' + crack_id,
        HttpStatus.NOT_FOUND,
      )
    }
  }

  async GetAllInspections() {
    try {
      // Gọi microservice và trả về kết quả trực tiếp
      // Không cần xử lý pre-signed URL nữa vì đã được xử lý ở microservice
      const response = await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.GET, {})
          .pipe(
            timeout(10000),
            catchError(err => {
              throw new HttpException(
                'Error retrieving all inspections',
                HttpStatus.INTERNAL_SERVER_ERROR,
              )
            })
          )
      )

      return response;
    } catch (error) {
      throw new HttpException(
        'Error retrieving all inspections',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async createInspection(
    dto: CreateInspectionDto,
    userId: string,
    files?: Express.Multer.File[]
  ): Promise<ApiResponse<Inspection>> {
    try {
      // First, verify if the user has Staff role
      const userResponse = await this.validateUserIsStaff(userId)

      if (!userResponse.isSuccess) {
        return userResponse
      }

      // If files are provided, upload them to S3 via Crack service
      let imageUrls: string[] = []
      if (files && files.length > 0) {
        try {
          // Convert file buffers to base64 for transport over RabbitMQ
          const processedFiles = files.map(file => ({
            ...file,
            buffer: file.buffer.toString('base64')
          }))

          // Call the crack service to upload the images
          const uploadResponse = await firstValueFrom(
            this.crackClient.send(
              { cmd: 'upload-inspection-images' },
              { files: processedFiles }
            ).pipe(
              timeout(30000),
              catchError(err => {
                console.error('Error uploading images:', err)
                return of(new ApiResponse(false, 'Error uploading images', null))
              })
            )
          )

          if (uploadResponse.isSuccess && uploadResponse.data && uploadResponse.data.InspectionImage) {
            imageUrls = uploadResponse.data.InspectionImage
              ('Uploaded image URLs:', imageUrls)
          } else {
            console.error('Image upload failed:', uploadResponse)
            // Continue without images
          }
        } catch (error) {
          console.error('Error in image upload process:', error)
          // Continue without images
        }
      }

      // This ensures only the authenticated user's ID is used and includes image URLs
      const updatedDto = {
        ...dto,
        inspected_by: userId, // Override any value in the DTO with the authenticated user's ID
        image_urls: imageUrls, // Add the image URLs from S3
        location_details: {
          // Add location details
          // This is a placeholder and should be replaced with actual implementation
          // For example, you can use the buildingClient to fetch location details
          // or manually add location details
        }
      }

      // Create the inspection
      const response = await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.CREATE, updatedDto)
          .pipe(
            timeout(10000),
            catchError(err => {
              // Format error message from the microservice
              let errorMsg = 'Error creating inspection'
              if (err.message) {
                if (err.message.includes('Leader')) {
                  errorMsg = 'Only Staff can create inspections'
                } else if (err.message.includes('task assignment')) {
                  errorMsg = 'Task assignment not found'
                }
              }
              return of(new ApiResponse(false, errorMsg, null))
            })
          )
      )

      // If inspection was created successfully, create a LocationDetail
      if (response.isSuccess && response.data) {
        try {
          const inspection = response.data

            // Get the buildingDetailId from task_assignment_id via related tables
            ('Retrieving buildingDetailId for task_assignment_id:', dto.task_assignment_id)
          const buildingDetailResponse = await firstValueFrom(
            this.inspectionClient.send(
              { cmd: 'get-building-detail-id-from-task-assignment' },
              { task_assignment_id: dto.task_assignment_id }
            ).pipe(
              timeout(10000),
              catchError(err => {
                console.error('Error getting buildingDetailId:', err)
                return of({ isSuccess: false, data: null })
              })
            )
          )

          // Default UUID or actual value from query
          let buildingDetailId = '00000000-0000-0000-0000-000000000000'

          if (buildingDetailResponse && buildingDetailResponse.isSuccess && buildingDetailResponse.data) {
            buildingDetailId = buildingDetailResponse.data.buildingDetailId
              ('Retrieved buildingDetailId:', buildingDetailId)
          } else {
            console.warn('Could not retrieve buildingDetailId, using default UUID')
          }

          // Support for multiple locationDetails
          const locationDetails = []

          // Fix additionalLocationDetails format if needed
          let additionalLocDetails: any = dto.additionalLocationDetails

          // Handle case when additionalLocationDetails is undefined, null, or an empty string
          if (!additionalLocDetails || (typeof additionalLocDetails === 'string' && additionalLocDetails.trim() === '')) {
            ('additionalLocationDetails is empty or not provided')
            additionalLocDetails = []
          }
          // Check if additionalLocationDetails exists but isn't an array (common issue with form data)
          else if (!Array.isArray(additionalLocDetails)) {
            try {
              // Try to parse it if it's a JSON string
              if (typeof additionalLocDetails === 'string') {
                // Empty JSON array case
                if (additionalLocDetails.trim() === '[]') {
                  additionalLocDetails = []
                }
                // Handle the case where we get a string with multiple objects separated by commas
                // but without enclosing square brackets
                const additionalStr = additionalLocDetails as string

                if (additionalStr.trim().startsWith('{') &&
                  (additionalStr.includes('},{') || additionalStr.includes('},{'))) {
                  ('Detected multiple JSON objects without array wrapper')

                  // Try to convert to a valid JSON array string by wrapping with square brackets
                  try {
                    // Special handling for the format "{obj1},{obj2},{obj3}"
                    // First check if it's already a valid JSON (unlikely but check anyway)
                    try {
                      const tempParsed = JSON.parse(additionalStr)
                      additionalLocDetails = [tempParsed]
                    } catch (e) {
                      // Not a valid JSON, try to convert it to an array
                      const wrappedJson = '[' + additionalStr + ']'
                      try {
                        additionalLocDetails = JSON.parse(wrappedJson)
                      } catch (e2) {
                        // Still not valid, try another approach with regex
                        ('First attempt failed, trying regex approach')

                        // Split the string into individual JSON objects
                        // This regex finds objects that start with { and end with }
                        const objectsRegex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g
                        const matches = additionalStr.match(objectsRegex)

                        if (matches && matches.length > 0) {
                          additionalLocDetails = matches.map(obj => {
                            try {
                              return JSON.parse(obj)
                            } catch (parseErr) {
                              console.error('Error parsing individual object:', parseErr)
                              return null
                            }
                          }).filter(obj => obj !== null)
                        } else {
                          console.error('No JSON objects found with regex')
                          additionalLocDetails = []
                        }
                      }
                    }
                  } catch (objError) {
                    console.error('Error processing multiple JSON objects:', objError)
                    additionalLocDetails = []
                  }
                } else {
                  // Regular JSON string, try to parse normally
                  additionalLocDetails = JSON.parse(additionalStr)
                }
              }

              // If it's still not an array but an object, convert to array
              if (!Array.isArray(additionalLocDetails) && typeof additionalLocDetails === 'object') {
                additionalLocDetails = [additionalLocDetails]
              }
            } catch (error) {
              console.error('Error parsing additionalLocationDetails:', error)
              // Default to array if parsing fails
              additionalLocDetails = []
            }
          }

          // Normalize additionalLocationDetails array - fix string elements
          if (Array.isArray(additionalLocDetails)) {
            additionalLocDetails = additionalLocDetails.map(item => {
              if (typeof item === 'string') {
                try {
                  return JSON.parse(item)
                } catch (e) {
                  console.error('Failed to parse location detail item:', e)
                  return null
                }
              }
              return item
            }).filter(item => item !== null)
          }

          // If additionalLocationDetails is provided in the DTO, add them
          if (additionalLocDetails && Array.isArray(additionalLocDetails) && additionalLocDetails.length > 0) {

            // Map additional location details to proper format and add to array
            additionalLocDetails.forEach(locationDetail => {
              locationDetails.push({
                buildingDetailId: locationDetail.buildingDetailId || buildingDetailId,
                inspection_id: inspection.inspection_id,
                roomNumber: locationDetail.roomNumber || "Unknown",
                floorNumber: locationDetail.floorNumber || 1,
                areaType: this.convertToAreaDetailsType(locationDetail.areaType) || "Other",
                description: locationDetail.description || "Additional location detail"
              })
            })
          }
          // Nếu additionalLocationDetails là mảng rỗng có chủ ý, không tạo mặc định
          else if (additionalLocDetails && Array.isArray(additionalLocDetails) && additionalLocDetails.length === 0) {
            // Không tạo mặc định, giữ mảng rỗng
          }
          // Trường hợp không có additionalLocationDetails hoặc nó là null/undefined
          else {
            locationDetails.push({
              buildingDetailId: buildingDetailId,
              inspection_id: inspection.inspection_id,
              roomNumber: "Unknown",
              floorNumber: 1,
              areaType: "Other",
              description: "Created from Inspection"
            })
          }


          // Emit a single event with all location details - use CREATE instead of CREATE_MANY to avoid duplication
          if (locationDetails.length > 0) {

            // Emit separate events for each location detail to avoid duplication
            locationDetails.forEach(detail => {
              this.buildingClient.emit(LOCATIONDETAIL_PATTERN.CREATE, detail)
            })

            // Add locationDetail info to the response ONLY if we have location details
            response.data.locationDetails = locationDetails.map(detail => ({
              inspection_id: detail.inspection_id,
              buildingDetailId: detail.buildingDetailId,
              roomNumber: detail.roomNumber,
              floorNumber: detail.floorNumber,
              areaType: detail.areaType,
              description: detail.description
            }))

          } else {
            // Không thêm locationDetails vào response khi không có location details nào
            // Nếu đã có thuộc tính locationDetails, xóa nó khỏi response data
            if (response.data.locationDetails) {
              delete response.data.locationDetails;
            }
          }
        } catch (error) {
          console.error('Error in LocationDetail creation process:', error)
          // Don't fail the whole request if LocationDetail creation fails
        }
      }

      return response
    } catch (error) {
      return new ApiResponse(false, `Error creating inspection: ${error.message}`, null)
    }
  }

  async changeStatus(dto: ChangeInspectionStatusDto): Promise<ApiResponse<Inspection>> {
    try {
      return await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.CHANGE_STATUS, dto)
      )
    } catch (error) {
      return new ApiResponse(false, 'Error changing inspection status', error.message)
    }
  }

  async addImage(dto: AddImageToInspectionDto): Promise<ApiResponse<Inspection>> {
    try {
      return await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.ADD_IMAGE, dto)
      )
    } catch (error) {
      return new ApiResponse(false, 'Error adding image', error.message)
    }
  }

  async getInspectionDetails(inspection_id: string): Promise<ApiResponse<any>> {
    try {
      // Gọi microservice và trả về kết quả trực tiếp
      // Không cần xử lý pre-signed URL nữa vì đã được xử lý ở microservice
      const response = await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.GET_DETAILS, inspection_id)
      )

      return response;
    } catch (error) {
      return new ApiResponse(false, 'Error getting inspection details', error.message)
    }
  }

  async getInspectionById(inspection_id: string): Promise<any> {
    try {
      // Gọi microservice và trả về kết quả trực tiếp
      // Không cần xử lý pre-signed URL nữa vì đã được xử lý ở microservice
      const response = await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.GET_BY_ID, { inspection_id })
      )

      return response;
    } catch (error) {
      return {
        isSuccess: false,
        message: 'Error getting inspection',
        data: error.message
      }
    }
  }

  // Helper method to validate that a user is Staff
  private async validateUserIsStaff(userId: string): Promise<ApiResponse<any>> {
    try {
      // Use the gRPC UserService to get user info

      // Use the correctly initialized userService from OnModuleInit
      const userInfo = await firstValueFrom(
        this.userService.getUserInfo({ userId, username: '' })
          .pipe(
            timeout(10000),
            catchError(err => {
              console.error('Error fetching user info:', err)
              return of(null)
            })
          )
      )


      if (!userInfo) {
        console.error('User info is null or undefined')
        return new ApiResponse(false, 'Failed to retrieve user information', null)
      }

      // Check if user has role Staff
      const role = userInfo.role

      if (role !== 'Staff') {
        return new ApiResponse(
          false,
          `Only Staff can create inspections. Current role: ${role}`,
          null
        )
      }

      return new ApiResponse(true, 'User is a Staff', { userId })
    } catch (error) {
      console.error('Error in validateUserIsStaff:', error)
      return new ApiResponse(false, `Error validating user role: ${error.message}`, null)
    }
  }

  // Helper method to convert string to AreaDetailsType enum
  private convertToAreaDetailsType(areaType?: string): string {
    if (!areaType) return "Other"

    // Normalize the input (lowercase, remove spaces)
    const normalized = areaType.toLowerCase().trim()

    // Map to enum values
    if (normalized.includes('floor')) return "Floor"
    if (normalized.includes('wall')) return "Wall"
    if (normalized.includes('ceiling')) return "Ceiling"
    if (normalized.includes('column')) return "column"

    // Default to Other
    return "Other"
  }
}
