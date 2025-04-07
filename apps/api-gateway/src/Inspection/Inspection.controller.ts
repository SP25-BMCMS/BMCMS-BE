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
  UseGuards,
} from '@nestjs/common';
import { InspectionService } from './Inspection.service';
import { catchError, firstValueFrom, NotFoundError } from 'rxjs';
import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { UpdateInspectionDto } from 'libs/contracts/src/inspections/update-inspection.dto';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { CreateInspectionDto } from '@app/contracts/inspections/create-inspection.dto';
import { ApiResponse as ApiResponseDto } from '@app/contracts/ApiReponse/api-response';
import { Inspection } from '@prisma/client-Task';
import { ChangeInspectionStatusDto } from '@app/contracts/inspections/change-inspection-status.dto';
import { AddImageToInspectionDto } from '@app/contracts/inspections/add-image.dto';

@Controller('inspections')
@ApiTags('inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

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
    );
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
    return this.inspectionService.updateInspection(inspection_id, dto);
  }

  @Get('inspection/crack/:crack_id')
  @ApiOperation({ summary: 'Get inspection by crack ID' })
  @ApiParam({ name: 'crack_id', description: 'Crack ID' })
  @ApiResponse({ status: 200, description: 'Inspection found' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async GetInspectionByCrackId(@Param('crack_id') crack_id: string) {
    return this.inspectionService.GetInspectionByCrackId(crack_id);
  }

  @Get('inspections')
  @ApiOperation({ summary: 'Get all inspections' })
  @ApiResponse({ status: 200, description: 'Returns all inspections' })
  async GetAllInspections() {
    return this.inspectionService.GetAllInspections();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new inspection' })
  @ApiBody({ type: CreateInspectionDto })
  @ApiResponse({ status: 201, description: 'Inspection created successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createInspection(@Body() dto: CreateInspectionDto): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.createInspection(dto);
  }

  @Patch('status')
  @ApiOperation({ summary: 'Change inspection status' })
  @ApiBody({ type: ChangeInspectionStatusDto })
  @ApiResponse({ status: 200, description: 'Inspection status updated successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async changeStatus(@Body() dto: ChangeInspectionStatusDto): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.changeStatus(dto);
  }

  @Post('add-image')
  @ApiOperation({ summary: 'Add image to inspection' })
  @ApiBody({ type: AddImageToInspectionDto })
  @ApiResponse({ status: 200, description: 'Image added successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addImage(@Body() dto: AddImageToInspectionDto): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.addImage(dto);
  }

   @Get(':id/details')
  @ApiOperation({ summary: 'Get inspection details with crack information' })
  @ApiParam({ name: 'id', description: 'Inspection ID' })
  async getInspectionDetails(@Param('id') id: string): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.getInspectionDetails(id);
  }

  @Get(':id')
  async getInspectionById(@Param('id') id: string) {
    return this.inspectionService.getInspectionById(id);
  }
}
