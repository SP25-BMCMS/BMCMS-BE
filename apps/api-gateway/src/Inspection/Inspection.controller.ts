import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { FilesInterceptor } from '@nestjs/platform-express'
import { UpdateInspectionPrivateAssetDto } from '@app/contracts/inspections/update-inspection-privateasset.dto'
import { UpdateInspectionReportStatusDto } from '@app/contracts/inspections/update-inspection-report-status.dto'
import { Response } from 'express'

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
    description: 'Creates a new inspection. The inspected_by field is automatically set to the authenticated user\'s ID. Only users with Staff role can create inspections.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateInspectionDto,
    description: 'Create a new inspection with optional images upload and location details',
    examples: {
      full_example: {
        summary: 'Complete example with location details',
        value: {
          task_assignment_id: '123e4567-e89b-12d3-a456-426614174000',
          description: 'This is a detailed inspection of the building',
          roomNumber: 'Room 101',
          floorNumber: 1,
          areaType: 'Floor',
          additionalLocationDetails: [
            {
              roomNumber: 'Room 102',
              floorNumber: 1,
              areaType: 'Wall',
              description: 'Kitchen wall with water damage'
            },
            {
              roomNumber: 'Room 103',
              floorNumber: 2,
              areaType: 'Ceiling',
              description: 'Ceiling with cracks'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Inspection created successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only Staff can create inspections' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async createInspection(
    @Body(new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false
    })) dto: CreateInspectionDto,
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<ApiResponseDto<Inspection>> {
    // Get staff ID from token
    console.log('Request user object:', JSON.stringify(req.user, null, 2))
    console.log('Request body:', JSON.stringify(dto, null, 2))

    const userId = req.user?.userId
    if (!userId) {
      return new ApiResponseDto(false, 'User not authenticated or invalid token', null)
    }

    // The userId from the token will be used as inspected_by
    return this.inspectionService.createInspection(dto, userId, files)
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
}
