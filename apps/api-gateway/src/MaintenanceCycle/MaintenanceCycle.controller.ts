import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/create-MaintenanceCycle.dto';
import { UpdateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/update-MaintenanceCycle.dto';
import { MaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.dto';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { MaintenanceCycleService } from './MaintenanceCycle.service';

@ApiTags('Maintenance Cycles')
@Controller('maintenance-cycles')
export class MaintenanceCycleController {
  constructor(private readonly maintenanceCycleService: MaintenanceCycleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new maintenance cycle' })
  @ApiResponse({ status: 201, type: MaintenanceCycleDto })
  async create(@Body() createDto: CreateMaintenanceCycleDto) {
    return this.maintenanceCycleService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all maintenance cycles' })
  @ApiResponse({ status: 200, type: [MaintenanceCycleDto] })
  async findAll(@Query() paginationParams: PaginationParams) {
    return this.maintenanceCycleService.findAll(paginationParams);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a maintenance cycle by ID' })
  @ApiResponse({ status: 200, type: MaintenanceCycleDto })
  async findById(@Param('id') cycle_id: string) {
    return this.maintenanceCycleService.findById(cycle_id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a maintenance cycle' })
  @ApiResponse({ status: 200, type: MaintenanceCycleDto })
  async update(
    @Param('id') cycle_id: string,
    @Body() updateDto: UpdateMaintenanceCycleDto,
  ) {
    return this.maintenanceCycleService.update(cycle_id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a maintenance cycle' })
  @ApiResponse({ status: 200, type: MaintenanceCycleDto })
  async delete(@Param('id') cycle_id: string) {
    return this.maintenanceCycleService.delete(cycle_id);
  }
} 