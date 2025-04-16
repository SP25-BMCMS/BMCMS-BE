import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CrackRecordService } from './CrackRecord.service';
import { CreateCrackRecordDto } from '@app/contracts/CrackRecord/create-CrackRecord.dto';
import { UpdateCrackRecordDto } from '@app/contracts/CrackRecord/update-CrackRecord.dto';
import { CrackRecordDto } from '@app/contracts/CrackRecord/CrackRecord.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';
import { PaginationParams, PaginationResponseDto } from '@app/contracts/Pagination/pagination.dto';
import { CRACK_RECORD_PATTERNS } from '@app/contracts/CrackRecord/CrackRecord.patterns';
@Controller()
export class CrackRecordController {
  private readonly logger = new Logger(CrackRecordController.name);

  constructor(private readonly crackRecordService: CrackRecordService) {}

  @MessagePattern(CRACK_RECORD_PATTERNS.CREATE)
  async create(@Payload() createDto: CreateCrackRecordDto): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Creating crack record: ${JSON.stringify(createDto)}`);
    return this.crackRecordService.create(createDto);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.GET_ALL)
  async findAll(@Payload() paginationParams?: PaginationParams): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Finding all crack records with pagination: ${JSON.stringify(paginationParams)}`);
    return this.crackRecordService.findAll(paginationParams);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.GET_BY_ID)
  async findById(@Payload() id: string): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Finding crack record by ID: ${id}`);
    return this.crackRecordService.findOne(id);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.UPDATE)
  async update(
    @Payload() data: { id: string; updateDto: UpdateCrackRecordDto }
  ): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Updating crack record ${data.id}: ${JSON.stringify(data.updateDto)}`);
    return this.crackRecordService.update(data.id, data.updateDto);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.DELETE)
  async delete(@Payload() id: string): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Deleting crack record: ${id}`);
    return this.crackRecordService.remove(id);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.GET_BY_BUILDING_DETAIL_ID)
  async getByBuildingDetailId(
    @Payload() data: { buildingDetailId: string; paginationParams?: PaginationParams }
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Getting crack records for building detail ${data.buildingDetailId} with pagination: ${JSON.stringify(data.paginationParams)}`);
    return this.crackRecordService.getByBuildingDetailId(data.buildingDetailId, data.paginationParams);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.GET_BY_INSPECTION_ID)
  async getByInspectionId(
    @Payload() data: { inspectionId: string; paginationParams?: PaginationParams }
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Getting crack records for inspection ${data.inspectionId} with pagination: ${JSON.stringify(data.paginationParams)}`);
    return this.crackRecordService.getByInspectionId(data.inspectionId, data.paginationParams);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.GET_BY_LOCATION_DETAIL_ID)
  async getByLocationDetailId(
    @Payload() data: { locationDetailId: string; paginationParams?: PaginationParams }
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Getting crack records for location detail ${data.locationDetailId} with pagination: ${JSON.stringify(data.paginationParams)}`);
    return this.crackRecordService.getByLocationDetailId(data.locationDetailId, data.paginationParams);
  }
} 