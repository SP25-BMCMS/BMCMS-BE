import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Logger } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/create-MaintenanceCycle.dto';
import { UpdateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/update-MaintenanceCycle.dto';
import { MaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.dto';
import { ApiResponse as ApiResponseContract } from '@app/contracts/ApiResponse/api-response';
import { PaginationParams, PaginationResponseDto } from '@app/contracts/Pagination/pagination.dto';
import { DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-Schedule';
import { MaintenanceCycleService } from './MaintenanceCycle.service';

@ApiTags('Maintenance Cycles')
@Controller('maintenance-cycles')
export class MaintenanceCycleController {
  private readonly logger = new Logger(MaintenanceCycleController.name);

  constructor(private readonly maintenanceCycleService: MaintenanceCycleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new maintenance cycle' })
  @ApiResponse({ status: 201, type: MaintenanceCycleDto })
  async create(@Body() createDto: CreateMaintenanceCycleDto): Promise<ApiResponseContract<MaintenanceCycleDto>> {
    this.logger.log(`Creating maintenance cycle: ${JSON.stringify(createDto)}`);
    return this.maintenanceCycleService.create(createDto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'device_type', required: false, example: '' })
  @ApiQuery({ name: 'basis', required: false, example: '' })
  @ApiQuery({ name: 'frequency', required: false, example: '' })
  @ApiOperation({ summary: 'Get all maintenance cycles' })
  @ApiResponse({ status: 200, type: [MaintenanceCycleDto] })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('device_type') device_type?: DeviceType,
    @Query('basis') basis?: MaintenanceBasis,
    @Query('frequency') frequency?: Frequency
  ): Promise<PaginationResponseDto<MaintenanceCycleDto>> {
    this.logger.log(`Finding all maintenance cycles with filters: ${JSON.stringify({
      page,
      limit,
      device_type,
      basis,
      frequency
    })}`);
    return this.maintenanceCycleService.findAll(
      { page, limit },
      device_type,
      basis,
      frequency
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a maintenance cycle by ID' })
  @ApiResponse({ status: 200, type: MaintenanceCycleDto })
  async findById(@Param('id') id: string): Promise<ApiResponseContract<MaintenanceCycleDto>> {
    this.logger.log(`Finding maintenance cycle by ID: ${id}`);
    return this.maintenanceCycleService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a maintenance cycle' })
  @ApiResponse({ status: 200, type: MaintenanceCycleDto })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaintenanceCycleDto
  ): Promise<ApiResponseContract<MaintenanceCycleDto>> {
    this.logger.log(`Updating maintenance cycle ${id}: ${JSON.stringify(updateDto)}`);
    return this.maintenanceCycleService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a maintenance cycle' })
  @ApiResponse({ status: 200, type: MaintenanceCycleDto })
  async remove(@Param('id') id: string): Promise<ApiResponseContract<MaintenanceCycleDto>> {
    this.logger.log(`Deleting maintenance cycle: ${id}`);
    return this.maintenanceCycleService.delete(id);
  }
} 