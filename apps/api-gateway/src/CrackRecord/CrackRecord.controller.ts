import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Patch,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CrackRecordService } from './CrackRecord.service';
import { CreateCrackRecordDto } from '@app/contracts/CrackRecord/create-CrackRecord.dto';
import { UpdateCrackRecordDto } from '@app/contracts/CrackRecord/update-CrackRecord.dto';
import { CrackRecordDto } from '@app/contracts/CrackRecord/CrackRecord.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';
import { PaginationParams, PaginationResponseDto } from '@app/contracts/Pagination/pagination.dto';

@ApiTags('Crack Records')
@Controller('crack-records')
export class CrackRecordController {
  private readonly logger = new Logger(CrackRecordController.name);

  constructor(private readonly crackRecordService: CrackRecordService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new crack record' })
  @SwaggerResponse({ type: CrackRecordDto })
  async create(@Body() createDto: CreateCrackRecordDto): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Creating crack record: ${JSON.stringify(createDto)}`);
    return await this.crackRecordService.create(createDto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOperation({ summary: 'Get all crack records' })
  @SwaggerResponse({ type: [CrackRecordDto] })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Finding all crack records with pagination: ${JSON.stringify({ page, limit })}`);
    return this.crackRecordService.findAll({ page, limit });
  }

  @Get('building/:buildingDetailId')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOperation({ summary: 'Get crack records by building detail ID' })
  @SwaggerResponse({ type: [CrackRecordDto] })
  async getByBuildingDetailId(
    @Param('buildingDetailId') buildingDetailId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Getting crack records for building detail ${buildingDetailId} with pagination: ${JSON.stringify({ page, limit })}`);
    return this.crackRecordService.getByBuildingDetailId(buildingDetailId, { page, limit });
  }

  @Get('inspection/:inspectionId')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOperation({ summary: 'Get crack records by inspection ID' })
  @SwaggerResponse({ type: [CrackRecordDto] })
  async getByInspectionId(
    @Param('inspectionId') inspectionId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Getting crack records for inspection ${inspectionId} with pagination: ${JSON.stringify({ page, limit })}`);
    return this.crackRecordService.getByInspectionId(inspectionId, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a crack record by ID' })
  @SwaggerResponse({ type: CrackRecordDto })
  async findById(@Param('id') id: string): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Finding crack record by ID: ${id}`);
    return await this.crackRecordService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a crack record' })
  @SwaggerResponse({ type: CrackRecordDto })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCrackRecordDto,
  ): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Updating crack record ${id}: ${JSON.stringify(updateDto)}`);
    return await this.crackRecordService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a crack record' })
  @SwaggerResponse({ type: CrackRecordDto })
  async remove(@Param('id') id: string): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Deleting crack record: ${id}`);
    return await this.crackRecordService.delete(id);
  }
} 