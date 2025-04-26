import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  Logger,
} from '@nestjs/common'
import { InspectionService } from './Inspection.service'
import { catchError, firstValueFrom, NotFoundError } from 'rxjs'
import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger'
import { ClientProxy } from '@nestjs/microservices'
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto'
import { UpdateInspectionDto } from 'libs/contracts/src/inspections/update-inspection.dto'
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto'
import { CreateInspectionDto } from '@app/contracts/inspections/create-inspection.dto'
import { ApiResponse as ApiResponseDto } from '@app/contracts/ApiResponse/api-response'
import { Inspection } from '@prisma/client-Task'
import { ChangeInspectionStatusDto } from '@app/contracts/inspections/change-inspection-status.dto'
import { AddImageToInspectionDto } from '@app/contracts/inspections/add-image.dto'
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard'
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { UpdateInspectionPrivateAssetDto } from '@app/contracts/inspections/update-inspection-privateasset.dto'
import { UpdateInspectionReportStatusDto } from '@app/contracts/inspections/update-inspection-report-status.dto'
import { Response } from 'express'
import { diskStorage } from 'multer'
import * as path from 'path'

// File filter function to check file types
const pdfFileFilter = (req, file, callback) => {
  if (file.fieldname === 'pdfFile') {
    // For pdfFile field, check if it's a PDF file, but let it pass anyway with a warning
    if (file.mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
      console.warn(`Warning: Non-PDF file uploaded in pdfFile field: ${file.originalname}, type: ${file.mimetype}`);
      // Attach a warning flag to the file for service layer to handle
      file.isPdfValidationWarning = true;
    }
  }

  // Accept all files regardless of type
  callback(null, true);
}

@Controller('inspections')
@ApiTags('inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) { }

  @Get('inspection/task_assignment/:task_assignment_id')
  @ApiOperation({ summary: 'Get inspection by task assignment ID' })
  @ApiParam({ name: 'task_assignment_id', description: 'Task assignment ID' })
  @ApiResponse({ status: 200, description: 'Inspection found' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async GetInspectionByTaskAssignmentId(
    @Param('task_assignment_id') task_assignment_id: string,
  ) {
    return this.inspectionService.GetInspectionByTaskAssignmentId(
      task_assignment_id,
    )
  }

  @Patch('inspection/:id')
  @ApiOperation({ summary: 'Update inspection' })
  @ApiParam({ name: 'id', description: 'Inspection ID' })
  @ApiBody({ type: UpdateInspectionDto })
  @ApiResponse({ status: 200, description: 'Inspection updated successfully' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async updateInspection(
    @Param('id') inspection_id: string,
    @Body() dto: UpdateInspectionDto,
  ) {
    return this.inspectionService.updateInspection(inspection_id, dto)
  }

  @Get('inspection/crack/:crack_id')
  @ApiOperation({ summary: 'Get inspection by crack ID' })
  @ApiParam({ name: 'crack_id', description: 'Crack ID' })
  @ApiResponse({ status: 200, description: 'Inspection found' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async GetInspectionByCrackId(@Param('crack_id') crack_id: string) {
    return this.inspectionService.GetInspectionByCrackId(crack_id)
  }

  @Get('inspections')
  @ApiOperation({ summary: 'Get all inspections' })
  @ApiResponse({ status: 200, description: 'Returns all inspections' })
  async GetAllInspections() {
    return this.inspectionService.GetAllInspections()
  }

  @Post()
  @UseGuards(PassportJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a new inspection',
    description: `Creates a new inspection with images, PDF uploads, and repair materials.
- The inspected_by field is automatically set to the authenticated user's ID
- Only users with Staff role can create inspections
- Upload images using the 'files' form field (supports multiple files, any image format)
- Upload a PDF report using the 'pdfFile' form field (single file only, STRICTLY PDF FORMAT ONLY)
- Add repair materials using the 'repairMaterials' field as an array of objects with materialId and quantity
- The uploaded PDF will be stored in the 'uploadFile' field in the database
- IMPORTANT: Make sure to name your form fields exactly 'files' and 'pdfFile'
- IMPORTANT: The 'pdfFile' field ONLY accepts actual PDF files (.pdf extension and/or application/pdf MIME type)
- If a non-PDF file is uploaded to the 'pdfFile' field, the request will be rejected with an error message`
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['task_assignment_id'],
      properties: {
        task_assignment_id: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
          description: 'ID of the task assignment'
        },
        description: {
          type: 'string',
          example: 'This is a detailed inspection of the building',
          description: 'Description of the inspection'
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          },
          description: 'Image files to upload - IMPORTANT: Use exactly this field name "files"'
        },
        pdfFile: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to upload - IMPORTANT: Use exactly this field name "pdfFile" and ONLY upload PDF files'
        },
        repairMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              materialId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
              quantity: { type: 'number', example: 2 }
            }
          },
          description: 'List of materials needed for repair with quantities'
        },
        additionalLocationDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              roomNumber: { type: 'string', example: 'Room 102' },
              floorNumber: { type: 'number', example: 1 },
              areaType: { type: 'string', example: 'Wall' },
              description: { type: 'string', example: 'Kitchen wall with water damage' }
            }
          },
          description: 'Additional location details for this inspection'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Inspection created successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only Staff can create inspections' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'files', maxCount: 10 },
        { name: 'pdfFile', maxCount: 1 },
      ],
      {
        fileFilter: pdfFileFilter
      }
    )
  )
  async createInspection(
    @Body(new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false
    })) dto: CreateInspectionDto,
    @Req() req: any,
    @UploadedFiles() files: { files?: Express.Multer.File[], pdfFile?: Express.Multer.File[] }
  ): Promise<ApiResponseDto<Inspection>> {
    // Get staff ID from token
    console.log('Request user object:', JSON.stringify(req.user, null, 2))
    console.log('Request body:', JSON.stringify(dto, null, 2))

    if (files) {
      console.log('Received files:')
      if (files.files && files.files.length > 0) {
        console.log(`- ${files.files.length} image files:`)
        files.files.forEach((file, index) => {
          console.log(`  Image ${index + 1}: ${file.originalname}, type: ${file.mimetype}, size: ${file.size} bytes`)
        })
      }

      if (files.pdfFile && files.pdfFile.length > 0) {
        console.log(`- PDF file: ${files.pdfFile[0].originalname}, type: ${files.pdfFile[0].mimetype}, size: ${files.pdfFile[0].size} bytes`)
      }
    }

    // Handle repair materials
    if (dto.repairMaterials) {
      console.log('Received repairMaterials:',
        typeof dto.repairMaterials === 'string'
          ? 'String format (needs parsing)'
          : `Array of ${Array.isArray(dto.repairMaterials) ? dto.repairMaterials.length : 0} items`);

      // If repairMaterials is a string (common with form-data), try to parse it
      if (typeof dto.repairMaterials === 'string') {
        try {
          dto.repairMaterials = JSON.parse(dto.repairMaterials);
          console.log('Successfully parsed repairMaterials into',
            Array.isArray(dto.repairMaterials)
              ? `array with ${dto.repairMaterials.length} items`
              : typeof dto.repairMaterials);
        } catch (error) {
          console.error('Error parsing repairMaterials:', error);
        }
      }
    } else {
      console.log('No repairMaterials provided in request');
    }

    const userId = req.user?.userId
    if (!userId) {
      return new ApiResponseDto(false, 'User not authenticated or invalid token', null)
    }

    // Combine all files for processing in the service
    const allFiles: Express.Multer.File[] = [];

    // Add files from 'files' field
    if (files.files && files.files.length > 0) {
      // Make sure fieldname is preserved
      allFiles.push(...files.files.map(file => ({ ...file, fieldname: 'files' })));
    }

    // Add files from 'pdfFile' field
    if (files.pdfFile && files.pdfFile.length > 0) {
      // Make sure fieldname is preserved
      allFiles.push(...files.pdfFile.map(file => ({ ...file, fieldname: 'pdfFile' })));
    }

    // The userId from the token will be used as inspected_by
    return this.inspectionService.createInspection(dto, userId, allFiles)
  }

  @Patch('status')
  @ApiOperation({ summary: 'Change inspection status' })
  @ApiBody({ type: ChangeInspectionStatusDto })
  @ApiResponse({ status: 200, description: 'Inspection status updated successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async changeStatus(@Body() dto: ChangeInspectionStatusDto): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.changeStatus(dto)
  }

  @Post('add-image')
  @ApiOperation({ summary: 'Add image to inspection' })
  @ApiBody({ type: AddImageToInspectionDto })
  @ApiResponse({ status: 200, description: 'Image added successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addImage(@Body() dto: AddImageToInspectionDto): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.addImage(dto)
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get inspection details with crack information' })
  @ApiParam({ name: 'id', description: 'Inspection ID' })
  async getInspectionDetails(@Param('id') id: string): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.getInspectionDetails(id)
  }

  @Get(':id')
  async getInspectionById(@Param('id') id: string) {
    return this.inspectionService.getInspectionById(id)
  }

  @Patch(':inspection_id/private-asset')
  @ApiOperation({ summary: 'Update inspection private asset status' })
  @ApiParam({ name: 'inspection_id', description: 'Inspection ID', type: 'string' })
  @ApiBody({ type: UpdateInspectionPrivateAssetDto })
  @ApiResponse({ status: 200, description: 'Inspection private asset status updated successfully' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateInspectionPrivateAsset(
    @Param('inspection_id') inspection_id: string,
    @Body() dto: UpdateInspectionPrivateAssetDto
  ) {
    return this.inspectionService.updateInspectionPrivateAsset(inspection_id, dto);
  }

  @Patch(':inspection_id/report-status')
  @ApiOperation({ summary: 'Update inspection report status' })
  @ApiParam({ name: 'inspection_id', description: 'Inspection ID', type: 'string' })
  @ApiBody({ type: UpdateInspectionReportStatusDto })
  @ApiResponse({ status: 200, description: 'Inspection report status updated successfully' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateInspectionReportStatus(
    @Param('inspection_id') inspection_id: string,
    @Body() dto: UpdateInspectionReportStatusDto
  ) {
    return this.inspectionService.updateInspectionReportStatus(inspection_id, dto);
  }

  @Put('report-status/manager')
  @ApiOperation({ summary: 'Update inspection report status by manager' })
  @ApiResponse({ status: 200, description: 'Report status updated by manager successfully' })
  // @ApiBearerAuth()
  // @UseGuards(PassportJwtAuthGuard)
  async updateInspectionReportStatusByManager(
    @Body() dto: UpdateInspectionReportStatusDto
  ) {
    return this.inspectionService.updateInspectionReportStatusByManager(dto);
  }

}
