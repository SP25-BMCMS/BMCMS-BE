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
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ConfigService } from '@nestjs/config'
import { UpdateInspectionPrivateAssetDto } from '@app/contracts/inspections/update-inspection-privateasset.dto'
import { UpdateInspectionReportStatusDto } from '@app/contracts/inspections/update-inspection-report-status.dto'

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
   * Get pre-signed URL with content disposition for an S3 object
   * @param fileKey The S3 object key
   * @param contentDisposition Content-Disposition header value
   * @returns A pre-signed URL for accessing the object with specified content disposition
   */
  async getPreSignedUrlWithDisposition(fileKey: string, contentDisposition: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ResponseContentDisposition: contentDisposition
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
        'Không tìm thấy báo cáo với ID nhiệm vụ được gán = ' +
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
        'Không tìm thấy báo cáo với ID vết nứt = ' + crack_id,
        HttpStatus.NOT_FOUND,
      )
    }
  }

  async GetAllInspections() {
    try {
      const response = await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.GET, {})
          .pipe(
            timeout(10000),
            catchError(err => {
              throw new HttpException(
                'Lỗi khi lấy danh sách báo cáo',
                HttpStatus.INTERNAL_SERVER_ERROR,
              )
            })
          )
      )

      return response;
    } catch (error) {
      throw new HttpException(
        'Lỗi khi lấy danh sách báo cáo',
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
      let pdfUrl: string = null

      if (files && files.length > 0) {
        try {
          // Log detailed file information for debugging
          console.log('======= FILE PROCESSING STARTED =======')
          console.log(`Total files received: ${files.length}`)
          files.forEach((file, index) => {
            console.log(`File ${index + 1}: ${file.originalname}, fieldname: ${file.fieldname}, mimetype: ${file.mimetype}, size: ${file.size} bytes`)
          })

          // Group files by their origins
          const pdfFiles = files.filter(file => file.fieldname === 'pdfFile')
          const imageFiles = files.filter(file => file.fieldname === 'files')

          console.log(`Grouped files: ${pdfFiles.length} PDF files, ${imageFiles.length} image files`)

          // Handle PDF file upload if provided
          if (pdfFiles.length > 0) {
            const pdfFile = pdfFiles[0]
            console.log(`Processing PDF file: ${pdfFile.originalname}, fieldname: ${pdfFile.fieldname}, mimetype: ${pdfFile.mimetype}`)

            // Check if the file is actually a PDF
            const isPdf = pdfFile.mimetype === 'application/pdf' ||
              pdfFile.originalname.toLowerCase().endsWith('.pdf');

            if (!isPdf) {
              console.error(`Error: Non-PDF file uploaded through pdfFile field: ${pdfFile.originalname}, mimetype: ${pdfFile.mimetype}`);
              return new ApiResponse(
                false,
                'Loại tệp không hợp lệ cho tải lên PDF. Chỉ chấp nhận tệp PDF trong trường pdfFile.',
                null
              );
            }

            // Generate a unique filename
            const fileExt = pdfFile.originalname.split('.').pop()
            const uniqueFileName = `inspections/reports/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`

            try {
              // Upload the PDF file
              const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: uniqueFileName,
                Body: pdfFile.buffer,
                ContentType: 'application/pdf'
              })

              await this.s3.send(command)

              const s3BaseUrl = `https://${this.bucketName}.s3.amazonaws.com/`
              pdfUrl = s3BaseUrl + uniqueFileName
              console.log('PDF uploaded successfully, URL:', pdfUrl)
            } catch (uploadError) {
              console.error('Error uploading PDF to S3:', uploadError)
            }
          } else {
            console.log('No PDF files to process')
          }

          // Handle image files
          if (imageFiles.length > 0) {
            console.log(`Processing ${imageFiles.length} image files`)

            const processedFiles = imageFiles.map(file => ({
              ...file,
              buffer: file.buffer.toString('base64')
            }))

            const uploadResponse = await firstValueFrom(
              this.crackClient.send(
                { cmd: 'upload-inspection-images' },
                { files: processedFiles }
              ).pipe(
                timeout(30000),
                catchError(err => {
                  console.error('Error uploading images:', err)
                  return of(new ApiResponse(false, 'Lỗi khi tải lên hình ảnh', null))
                })
              )
            )

            if (uploadResponse.isSuccess && uploadResponse.data && uploadResponse.data.InspectionImage) {
              imageUrls = uploadResponse.data.InspectionImage
              console.log(`Successfully uploaded ${imageUrls.length} images:`, imageUrls)
            } else {
              console.error('Image upload failed:', uploadResponse)
            }
          } else {
            console.log('No image files to process')
          }

          console.log('======= FILE PROCESSING FINISHED =======')
          console.log('Final results:')
          console.log(`- Images: ${imageUrls.length > 0 ? imageUrls.length + ' files uploaded' : 'None'}`)
          console.log(`- PDF: ${pdfUrl ? 'Uploaded successfully' : 'None'}`)
        } catch (error) {
          console.error('Error in file upload process:', error)
        }
      }

      const updatedDto = {
        ...dto,
        inspected_by: userId,
        image_urls: imageUrls,
        uploadFile: pdfUrl,
        location_details: {}
      }

      if (dto.repairMaterials) {
        console.log('Repair materials provided:', dto.repairMaterials);
      }

      const response = await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.CREATE, updatedDto)
          .pipe(
            timeout(100000),
            catchError(err => {
              let errorMsg = 'Lỗi khi tạo báo cáo'
              if (err.message) {
                if (err.message.includes('Leader')) {
                  errorMsg = 'Chỉ nhân viên mới có thể tạo báo cáo'
                } else if (err.message.includes('task assignment')) {
                  errorMsg = 'Không tìm thấy nhiệm vụ được gán'
                }
              }
              return of(new ApiResponse(false, errorMsg, null))
            })
          )
      )

      if (response.isSuccess && response.data) {
        try {
          const inspection = response.data

          console.log('Retrieving buildingDetailId for task_assignment_id:', dto.task_assignment_id)
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

          let buildingDetailId = '00000000-0000-0000-0000-000000000000'

          if (buildingDetailResponse && buildingDetailResponse.isSuccess && buildingDetailResponse.data) {
            buildingDetailId = buildingDetailResponse.data.buildingDetailId
            console.log('Retrieved buildingDetailId:', buildingDetailId)
          } else {
            console.warn('Could not retrieve buildingDetailId, using default UUID')
          }

          const locationDetails = []

          let additionalLocDetails: any = dto.additionalLocationDetails

          if (!additionalLocDetails || (typeof additionalLocDetails === 'string' && additionalLocDetails.trim() === '')) {
            console.log('additionalLocationDetails is empty or not provided')
            additionalLocDetails = []
          }
          else if (!Array.isArray(additionalLocDetails)) {
            try {
              if (typeof additionalLocDetails === 'string') {
                if (additionalLocDetails.trim() === '[]') {
                  additionalLocDetails = []
                }
                const additionalStr = additionalLocDetails as string

                if (additionalStr.trim().startsWith('{') &&
                  (additionalStr.includes('},{') || additionalStr.includes('},{'))) {
                  console.log('Detected multiple JSON objects without array wrapper')

                  try {
                    try {
                      const tempParsed = JSON.parse(additionalStr)
                      additionalLocDetails = [tempParsed]
                    } catch (e) {
                      const wrappedJson = '[' + additionalStr + ']'
                      try {
                        additionalLocDetails = JSON.parse(wrappedJson)
                      } catch (e2) {
                        console.log('First attempt failed, trying regex approach')

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
                  additionalLocDetails = JSON.parse(additionalStr)
                }
              }

              if (!Array.isArray(additionalLocDetails) && typeof additionalLocDetails === 'object') {
                additionalLocDetails = [additionalLocDetails]
              }
            } catch (error) {
              console.error('Error parsing additionalLocationDetails:', error)
              additionalLocDetails = []
            }
          }

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

          if (additionalLocDetails && Array.isArray(additionalLocDetails) && additionalLocDetails.length > 0) {
            additionalLocDetails.forEach(locationDetail => {
              locationDetails.push({
                buildingDetailId: locationDetail.buildingDetailId || buildingDetailId,
                inspection_id: inspection.inspection_id,
                roomNumber: locationDetail.roomNumber || "Chưa xác định",
                floorNumber: locationDetail.floorNumber || 1,
                areaType: this.convertToAreaDetailsType(locationDetail.areaType) || "Khác",
                description: locationDetail.description || "Chi tiết vị trí bổ sung"
              })
            })
          }
          else if (additionalLocDetails && Array.isArray(additionalLocDetails) && additionalLocDetails.length === 0) {
            // Không tạo mặc định, giữ mảng rỗng
          }
          else {
            locationDetails.push({
              buildingDetailId: buildingDetailId,
              inspection_id: inspection.inspection_id,
              roomNumber: "Chưa xác định",
              floorNumber: 1,
              areaType: "Khác",
              description: "Được tạo từ báo cáo"
            })
          }

          locationDetails.forEach(detail => {
            this.buildingClient.emit(LOCATIONDETAIL_PATTERN.CREATE, detail)
          })

          if (response && response.data && typeof response.data === 'object') {
            const locationDetailsData = locationDetails.map(detail => ({
              inspection_id: detail.inspection_id,
              buildingDetailId: detail.buildingDetailId,
              roomNumber: detail.roomNumber,
              floorNumber: detail.floorNumber,
              areaType: detail.areaType,
              description: detail.description
            }));

            Object.assign(response.data, { locationDetails: locationDetailsData });
          } else {
            console.error('Cannot add locationDetails to response: invalid response structure',
              response ? typeof response.data : 'response is null')
          }
        } catch (error) {
          console.error('Error in LocationDetail creation process:', error)
        }
      }

      return response
    } catch (error) {
      return new ApiResponse(false, `Lỗi khi tạo báo cáo: ${error.message}`, null)
    }
  }

  async createInspectionActualCost(
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
      let pdfUrl: string = null

      if (files && files.length > 0) {
        try {
          // Log detailed file information for debugging
          console.log('======= FILE PROCESSING STARTED =======')
          console.log(`Total files received: ${files.length}`)
          files.forEach((file, index) => {
            console.log(`File ${index + 1}: ${file.originalname}, fieldname: ${file.fieldname}, mimetype: ${file.mimetype}, size: ${file.size} bytes`)
          })

          // Group files by their origins
          const pdfFiles = files.filter(file => file.fieldname === 'pdfFile')
          const imageFiles = files.filter(file => file.fieldname === 'files')

          console.log(`Grouped files: ${pdfFiles.length} PDF files, ${imageFiles.length} image files`)

          // Handle PDF file upload if provided
          if (pdfFiles.length > 0) {
            const pdfFile = pdfFiles[0]
            console.log(`Processing PDF file: ${pdfFile.originalname}, fieldname: ${pdfFile.fieldname}, mimetype: ${pdfFile.mimetype}`)

            // Check if the file is actually a PDF
            const isPdf = pdfFile.mimetype === 'application/pdf' ||
              pdfFile.originalname.toLowerCase().endsWith('.pdf');

            if (!isPdf) {
              console.error(`Error: Non-PDF file uploaded through pdfFile field: ${pdfFile.originalname}, mimetype: ${pdfFile.mimetype}`);
              return new ApiResponse(
                false,
                'Loại tệp không hợp lệ cho tải lên PDF. Chỉ chấp nhận tệp PDF trong trường pdfFile.',
                null
              );
            }

            // Generate a unique filename
            const fileExt = pdfFile.originalname.split('.').pop()
            const uniqueFileName = `inspections/reports/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`

            try {
              // Upload the PDF file
              const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: uniqueFileName,
                Body: pdfFile.buffer,
                ContentType: 'application/pdf'
              })

              await this.s3.send(command)

              const s3BaseUrl = `https://${this.bucketName}.s3.amazonaws.com/`
              pdfUrl = s3BaseUrl + uniqueFileName
              console.log('PDF uploaded successfully, URL:', pdfUrl)
            } catch (uploadError) {
              console.error('Error uploading PDF to S3:', uploadError)
            }
          } else {
            console.log('No PDF files to process')
          }

          // Handle image files
          if (imageFiles.length > 0) {
            console.log(`Processing ${imageFiles.length} image files`)

            const processedFiles = imageFiles.map(file => ({
              ...file,
              buffer: file.buffer.toString('base64')
            }))

            const uploadResponse = await firstValueFrom(
              this.crackClient.send(
                { cmd: 'upload-inspection-images' },
                { files: processedFiles }
              ).pipe(
                timeout(30000),
                catchError(err => {
                  console.error('Error uploading images:', err)
                  return of(new ApiResponse(false, 'Lỗi khi tải lên hình ảnh', null))
                })
              )
            )

            if (uploadResponse.isSuccess && uploadResponse.data && uploadResponse.data.InspectionImage) {
              imageUrls = uploadResponse.data.InspectionImage
              console.log(`Successfully uploaded ${imageUrls.length} images:`, imageUrls)
            } else {
              console.error('Image upload failed:', uploadResponse)
            }
          } else {
            console.log('No image files to process')
          }

          console.log('======= FILE PROCESSING FINISHED =======')
          console.log('Final results:')
          console.log(`- Images: ${imageUrls.length > 0 ? imageUrls.length + ' files uploaded' : 'None'}`)
          console.log(`- PDF: ${pdfUrl ? 'Uploaded successfully' : 'None'}`)
        } catch (error) {
          console.error('Error in file upload process:', error)
        }
      }

      const updatedDto = {
        ...dto,
        inspected_by: userId,
        image_urls: imageUrls,
        uploadFile: pdfUrl,
        location_details: {}
      }

      if (dto.repairMaterials) {
        console.log('Repair materials provided:', dto.repairMaterials);
      }

      const response = await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.CREATE_ACTUAL_COST, updatedDto)
          .pipe(
            timeout(100000),
            catchError(err => {
              let errorMsg = 'Lỗi khi tạo báo cáo'
              if (err.message) {
                if (err.message.includes('Leader')) {
                  errorMsg = 'Chỉ nhân viên mới có thể tạo báo cáo'
                } else if (err.message.includes('task assignment')) {
                  errorMsg = 'Không tìm thấy nhiệm vụ được gán'
                }
              }
              return of(new ApiResponse(false, errorMsg, null))
            })
          )
      )

      if (response.isSuccess && response.data) {
        try {
          const inspection = response.data

          console.log('Retrieving buildingDetailId for task_assignment_id:', dto.task_assignment_id)
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

          let buildingDetailId = '00000000-0000-0000-0000-000000000000'

          if (buildingDetailResponse && buildingDetailResponse.isSuccess && buildingDetailResponse.data) {
            buildingDetailId = buildingDetailResponse.data.buildingDetailId
            console.log('Retrieved buildingDetailId:', buildingDetailId)
          } else {
            console.warn('Could not retrieve buildingDetailId, using default UUID')
          }

          const locationDetails = []

          let additionalLocDetails: any = dto.additionalLocationDetails

          if (!additionalLocDetails || (typeof additionalLocDetails === 'string' && additionalLocDetails.trim() === '')) {
            console.log('additionalLocationDetails is empty or not provided')
            additionalLocDetails = []
          }
          else if (!Array.isArray(additionalLocDetails)) {
            try {
              if (typeof additionalLocDetails === 'string') {
                if (additionalLocDetails.trim() === '[]') {
                  additionalLocDetails = []
                }
                const additionalStr = additionalLocDetails as string

                if (additionalStr.trim().startsWith('{') &&
                  (additionalStr.includes('},{') || additionalStr.includes('},{'))) {
                  console.log('Detected multiple JSON objects without array wrapper')

                  try {
                    try {
                      const tempParsed = JSON.parse(additionalStr)
                      additionalLocDetails = [tempParsed]
                    } catch (e) {
                      const wrappedJson = '[' + additionalStr + ']'
                      try {
                        additionalLocDetails = JSON.parse(wrappedJson)
                      } catch (e2) {
                        console.log('First attempt failed, trying regex approach')

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
                  additionalLocDetails = JSON.parse(additionalStr)
                }
              }

              if (!Array.isArray(additionalLocDetails) && typeof additionalLocDetails === 'object') {
                additionalLocDetails = [additionalLocDetails]
              }
            } catch (error) {
              console.error('Error parsing additionalLocationDetails:', error)
              additionalLocDetails = []
            }
          }

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

          if (additionalLocDetails && Array.isArray(additionalLocDetails) && additionalLocDetails.length > 0) {
            additionalLocDetails.forEach(locationDetail => {
              locationDetails.push({
                buildingDetailId: locationDetail.buildingDetailId || buildingDetailId,
                inspection_id: inspection.inspection_id,
                roomNumber: locationDetail.roomNumber || "Chưa xác định",
                floorNumber: locationDetail.floorNumber || 1,
                areaType: this.convertToAreaDetailsType(locationDetail.areaType) || "Khác",
                description: locationDetail.description || "Chi tiết vị trí bổ sung"
              })
            })
          }
          else if (additionalLocDetails && Array.isArray(additionalLocDetails) && additionalLocDetails.length === 0) {
            // Không tạo mặc định, giữ mảng rỗng
          }
          else {
            locationDetails.push({
              buildingDetailId: buildingDetailId,
              inspection_id: inspection.inspection_id,
              roomNumber: "Chưa xác định",
              floorNumber: 1,
              areaType: "Khác",
              description: "Được tạo từ báo cáo"
            })
          }

          locationDetails.forEach(detail => {
            this.buildingClient.emit(LOCATIONDETAIL_PATTERN.CREATE, detail)
          })

          if (response && response.data && typeof response.data === 'object') {
            const locationDetailsData = locationDetails.map(detail => ({
              inspection_id: detail.inspection_id,
              buildingDetailId: detail.buildingDetailId,
              roomNumber: detail.roomNumber,
              floorNumber: detail.floorNumber,
              areaType: detail.areaType,
              description: detail.description
            }));

            Object.assign(response.data, { locationDetails: locationDetailsData });
          } else {
            console.error('Cannot add locationDetails to response: invalid response structure',
              response ? typeof response.data : 'response is null')
          }
        } catch (error) {
          console.error('Error in LocationDetail creation process:', error)
        }
      }

      return response
    } catch (error) {
      return new ApiResponse(false, `Lỗi khi tạo báo cáo: ${error.message}`, null)
    }
  }

  async changeStatus(dto: ChangeInspectionStatusDto): Promise<ApiResponse<Inspection>> {
    try {
      return await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.CHANGE_STATUS, dto)
      )
    } catch (error) {
      return new ApiResponse(false, 'Lỗi khi thay đổi trạng thái báo cáo', error.message)
    }
  }

  async addImage(dto: AddImageToInspectionDto): Promise<ApiResponse<Inspection>> {
    try {
      return await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.ADD_IMAGE, dto)
      )
    } catch (error) {
      return new ApiResponse(false, 'Lỗi khi thêm hình ảnh', error.message)
    }
  }

  async getInspectionDetails(inspection_id: string): Promise<ApiResponse<any>> {
    try {
      const response = await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.GET_DETAILS, inspection_id)
      )

      if (response.isSuccess && response.data && response.data.uploadFile) {
        try {
          const fileKey = this.extractFileKey(response.data.uploadFile)
          response.data.uploadFile = await this.getPreSignedUrl(fileKey)
        } catch (error) {
          console.error('Error generating pre-signed URL for PDF:', error)
        }
      }

      return response;
    } catch (error) {
      return new ApiResponse(false, 'Lỗi khi lấy chi tiết báo cáo', error.message)
    }
  }

  async getInspectionById(inspection_id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.GET_BY_ID, { inspection_id })
      )

      if (response.isSuccess && response.data && response.data.uploadFile) {
        try {
          const fileKey = this.extractFileKey(response.data.uploadFile)
          response.data.uploadFile = await this.getPreSignedUrl(fileKey)
        } catch (error) {
          console.error('Error generating pre-signed URL for PDF:', error)
        }
      }

      return response;
    } catch (error) {
      return {
        isSuccess: false,
        message: 'Lỗi khi lấy thông tin báo cáo',
        data: error.message
      }
    }
  }

  private async validateUserIsStaff(userId: string): Promise<ApiResponse<any>> {
    try {
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
        return new ApiResponse(false, 'Không thể lấy thông tin người dùng', null)
      }

      const role = userInfo.role

      if (role !== 'Staff') {
        return new ApiResponse(
          false,
          `Chỉ nhân viên mới có thể tạo báo cáo. Vai trò hiện tại: ${role}`,
          null
        )
      }

      return new ApiResponse(true, 'Người dùng là nhân viên', { userId })
    } catch (error) {
      console.error('Error in validateUserIsStaff:', error)
      return new ApiResponse(false, `Lỗi khi xác thực vai trò người dùng: ${error.message}`, null)
    }
  }

  private convertToAreaDetailsType(areaType?: string): string {
    if (!areaType) return "Khác"

    const normalized = areaType.toLowerCase().trim()

    if (normalized.includes('floor')) return "Sàn"
    if (normalized.includes('wall')) return "Tường"
    if (normalized.includes('ceiling')) return "Trần"
    if (normalized.includes('column')) return "Cột"

    return "Khác"
  }

  async updateInspectionPrivateAsset(
    inspection_id: string,
    dto: UpdateInspectionPrivateAssetDto
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.UPDATE_PRIVATE_ASSET, {
          inspection_id,
          dto
        })
      );
    } catch (error) {
      console.error(`Failed to update inspection private asset status: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Lỗi khi cập nhật trạng thái tài sản riêng của báo cáo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateInspectionReportStatus(
    inspection_id: string,
    dto: UpdateInspectionReportStatusDto
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.UPDATE_REPORT_STATUS, {
          inspection_id,
          dto
        }).pipe(
          timeout(10000),
          catchError(err => {
            console.error('Error updating inspection report status:', err);
            return of(new ApiResponse(false, 'Lỗi khi cập nhật trạng thái báo cáo', null));
          })
        )
      );
    } catch (error) {
      console.error('Error in updateInspectionReportStatus:', error);
      return new ApiResponse(false, 'Lỗi khi cập nhật trạng thái báo cáo', null);
    }
  }

  async updateInspectionReportStatusByManager(
    dto: UpdateInspectionReportStatusDto
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.inspectionClient.send(INSPECTIONS_PATTERN.UPDATE_REPORT_STATUS_BY_MANAGER, dto)
          .pipe(
            timeout(10000),
            catchError(err => {
              console.error('Error updating inspection report status by manager:', err);
              return of(new ApiResponse(false, 'Lỗi khi cập nhật trạng thái báo cáo bởi quản lý', null));
            })
          )
      );
    } catch (error) {
      console.error('Error in updateInspectionReportStatusByManager:', error);
      return new ApiResponse(false, 'Lỗi khi cập nhật trạng thái báo cáo bởi quản lý', null);
    }
  }

  async getBuildingDetailIdFromTaskAssignment(task_assignment_id: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.inspectionClient.send({ cmd: 'get-building-detail-id-from-task-assignment' }, { task_assignment_id })
          .pipe(
            timeout(10000),
            catchError(err => {
              console.error('Error getting building detail ID from task assignment:', err);
              return of(new ApiResponse(false, 'Lỗi khi lấy ID chi tiết tòa nhà từ nhiệm vụ được gán', null));
            })
          )
      );
    } catch (error) {
      console.error('Error in getBuildingDetailIdFromTaskAssignment:', error);
      return new ApiResponse(false, 'Lỗi khi lấy ID chi tiết tòa nhà từ nhiệm vụ được gán', null);
    }
  }

  async getInspectionPdfByTaskAssignment(task_assignment_id: string): Promise<ApiResponse<any>> {
    try {
      // 1. Check if task assignment exists and has status = Confirmed
      const taskAssignmentResponse = await firstValueFrom(
        this.inspectionClient.send(
          INSPECTIONS_PATTERN.GET_TASK_ASSIGNMENT_DETAILS,
          { task_assignment_id }
        ).pipe(
          timeout(10000),
          catchError(err => {
            console.error('Error getting task assignment details:', err);
            return of(new ApiResponse(false, 'Lỗi khi lấy chi tiết nhiệm vụ được gán', null));
          })
        )
      );

      if (!taskAssignmentResponse.isSuccess || !taskAssignmentResponse.data) {
        return new ApiResponse(false, 'Không tìm thấy nhiệm vụ được gán', null);
      }

      const taskAssignment = taskAssignmentResponse.data;

      // Check if task assignment status is Confirmed
      if (taskAssignment.status !== 'Verified') {
        return new ApiResponse(
          false,
          `Nhiệm vụ được gán phải ở trạng thái Verified. Trạng thái hiện tại: ${taskAssignment.status}`,
          null
        );
      }

      // 2. Get verification of leader role and area match in one call
      const leaderVerificationResponse = await firstValueFrom(
        this.inspectionClient.send(
          { cmd: 'verify-leader-and-area' },
          {
            employee_id: taskAssignment.employee_id,
            task_id: taskAssignment.task_id
          }
        ).pipe(
          timeout(10000),
          catchError(err => {
            console.error('Error verifying leader and area match:', err);
            return of(new ApiResponse(false, 'Lỗi khi xác thực trưởng nhóm và khu vực', null));
          })
        )
      );

      if (!leaderVerificationResponse.isSuccess) {
        return new ApiResponse(
          false,
          leaderVerificationResponse.message || 'Lỗi khi xác thực trưởng nhóm và khu vực',
          null
        );
      }

      // 3. Get inspection with uploadFile if all checks pass
      const inspectionResponse = await firstValueFrom(
        this.inspectionClient.send(
          INSPECTIONS_PATTERN.GET_INSPECTION_PDF,
          { task_assignment_id }
        ).pipe(
          timeout(10000),
          catchError(err => {
            console.error('Error getting inspection PDF:', err);
            return of(new ApiResponse(false, 'Lỗi khi lấy tệp PDF của báo cáo', null));
          })
        )
      );

      if (!inspectionResponse.isSuccess || !inspectionResponse.data) {
        return new ApiResponse(false, 'Không tìm thấy tệp PDF cho báo cáo này', null);
      }

      // If a PDF URL exists, generate a pre-signed URL
      if (inspectionResponse.data.uploadFile) {
        try {
          const fileKey = this.extractFileKey(inspectionResponse.data.uploadFile);
          const fileName = fileKey.split('/').pop(); // Extract the filename

          // Generate both view and download URLs
          const viewUrl = await this.getPreSignedUrlWithDisposition(fileKey, 'inline');
          const downloadUrl = await this.getPreSignedUrlWithDisposition(fileKey, `attachment; filename="${fileName}"`);

          // Update the response with both URLs
          inspectionResponse.data.viewUrl = viewUrl;
          inspectionResponse.data.downloadUrl = downloadUrl;
          inspectionResponse.data.uploadFile = viewUrl; // Keep original field for backward compatibility
        } catch (error) {
          console.error(`Error getting pre-signed URLs for PDF file:`, error);
          // Keep original URL as fallback
        }
      }

      return new ApiResponse(
        true,
        'Tệp PDF báo cáo được tìm thấy và khu vực khớp',
        inspectionResponse.data
      );
    } catch (error) {
      console.error('Error in getInspectionPdfByTaskAssignment:', error);
      return new ApiResponse(
        false,
        `Lỗi khi lấy tệp PDF báo cáo: ${error.message}`,
        null
      );
    }
  }
}
