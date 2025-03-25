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
import { ApiOperation, ApiParam, ApiTags, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { CreateInspectionDto } from 'libs/contracts/src/inspections/create-inspection.dto';
import { UpdateInspectionDto } from 'libs/contracts/src/inspections/update-inspection.dto';

@Controller('inspections')
@ApiTags('inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new inspection' })
  @ApiBody({ type: CreateInspectionDto })
  @ApiResponse({ status: 201, description: 'Inspection created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createInspection(@Body() createInspectionDto: CreateInspectionDto) {
    return this.inspectionService.createInspection(createInspectionDto);
  }

  @Put(':inspection_id')
  @ApiOperation({ summary: 'Update an inspection' })
  @ApiParam({ name: 'inspection_id', description: 'Inspection ID' })
  @ApiBody({ type: UpdateInspectionDto })
  @ApiResponse({ status: 200, description: 'Inspection updated successfully' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateInspection(
    @Param('inspection_id') inspection_id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
  ) {
    return this.inspectionService.updateInspection(inspection_id, updateInspectionDto);
  }

  @Get(':inspection_id')
  @ApiOperation({ summary: 'Get inspection by ID' })
  @ApiParam({ name: 'inspection_id', description: 'Inspection ID' })
  @ApiResponse({ status: 200, description: 'Inspection found' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async getInspectionById(@Param('inspection_id') inspection_id: string) {
    return this.inspectionService.getInspectionById(inspection_id);
  }

  @Delete(':inspection_id')
  @ApiOperation({ summary: 'Delete an inspection' })
  @ApiParam({ name: 'inspection_id', description: 'Inspection ID' })
  @ApiResponse({ status: 200, description: 'Inspection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async deleteInspection(@Param('inspection_id') inspection_id: string) {
    return this.inspectionService.deleteInspection(inspection_id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inspections' })
  @ApiResponse({ status: 200, description: 'Returns all inspections' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getAllInspections(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    try {
      // Create pagination params object
      const paginationParams: PaginationParams = {
        page: page ? parseInt(page.toString()) : 1,
        limit: limit ? parseInt(limit.toString()) : 10
      };
      
      return this.inspectionService.getAllInspections(paginationParams);
    } catch (error) {
      console.error('Error in getAllInspections controller:', error);
      throw new Error(`Failed to get inspections: ${error.message}`);
    }
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get inspections by status' })
  @ApiParam({ name: 'status', description: 'Inspection status' })
  @ApiResponse({ status: 200, description: 'Returns inspections by status' })
  async getInspectionsByStatus(@Param('status') status: string) {
    return this.inspectionService.getInspectionsByStatus(status);
  }

  @Get('task/:task_id')
  @ApiOperation({ summary: 'Get inspections by task ID' })
  @ApiParam({ name: 'task_id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Returns inspections for the task' })
  @ApiResponse({ status: 404, description: 'No inspections found for this task' })
  async getInspectionsByTaskId(@Param('task_id') task_id: string) {
    return this.inspectionService.getInspectionsByTaskId(task_id);
  }

  @Get('location/:location_id')
  @ApiOperation({ summary: 'Get inspections by location ID' })
  @ApiParam({ name: 'location_id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Returns inspections for the location' })
  @ApiResponse({ status: 404, description: 'No inspections found for this location' })
  async getInspectionsByLocationId(@Param('location_id') location_id: string) {
    return this.inspectionService.getInspectionsByLocationId(location_id);
  }
} 