import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CRACK_RECORD_PATTERNS } from '@app/contracts/CrackRecord/CrackRecord.patterns';
import { CreateCrackRecordDto } from '@app/contracts/CrackRecord/create-CrackRecord.dto';
import { UpdateCrackRecordDto } from '@app/contracts/CrackRecord/update-CrackRecord.dto';
import { CrackRecordDto } from '@app/contracts/CrackRecord/CrackRecord.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';
import { PaginationParams, PaginationResponseDto } from '@app/contracts/Pagination/pagination.dto';
import { BUILDING_CLIENT } from '../constraints';

@Injectable()
export class CrackRecordService {
  private readonly logger = new Logger(CrackRecordService.name);

  constructor(
    @Inject(BUILDING_CLIENT) private readonly buildingService: ClientProxy,
  ) {}

  async create(createDto: CreateCrackRecordDto): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Sending create request to microservice: ${JSON.stringify(createDto)}`);
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.CREATE, createDto),
    );
  }

  async findAll(paginationParams?: PaginationParams): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Sending findAll request to microservice with pagination: ${JSON.stringify(paginationParams)}`);
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.GET_ALL, paginationParams),
    );
  }

  async findById(id: string): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Sending findById request to microservice: ${id}`);
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.GET_BY_ID, id),
    );
  }

  async update(
    id: string,
    updateDto: UpdateCrackRecordDto,
  ): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Sending update request to microservice: ${id}, ${JSON.stringify(updateDto)}`);
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.UPDATE, { id, updateDto }),
    );
  }

  async delete(id: string): Promise<ApiResponse<CrackRecordDto>> {
    this.logger.log(`Sending delete request to microservice: ${id}`);
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.DELETE, id),
    );
  }

  async findByLocation(
    locationId: string,
    page?: number,
    limit?: number,
  ): Promise<ApiResponse<CrackRecordDto[]>> {
    const paginationParams = {
      locationId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.GET_BY_LOCATION, paginationParams),
    );
  }

  async getByBuildingDetailId(
    buildingDetailId: string,
    paginationParams?: PaginationParams
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Sending getByBuildingDetailId request to microservice: ${buildingDetailId}, ${JSON.stringify(paginationParams)}`);
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.GET_BY_BUILDING_DETAIL_ID, {
        buildingDetailId,
        paginationParams
      }),
    );
  }

  async getByInspectionId(
    inspectionId: string,
    paginationParams?: PaginationParams
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Sending getByInspectionId request to microservice: ${inspectionId}, ${JSON.stringify(paginationParams)}`);
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.GET_BY_INSPECTION_ID, {
        inspectionId,
        paginationParams
      }),
    );
  }

  async getByLocationDetailId(
    locationDetailId: string,
    paginationParams?: PaginationParams
  ): Promise<PaginationResponseDto<CrackRecordDto>> {
    this.logger.log(`Sending getByLocationDetailId request to microservice: ${locationDetailId}, ${JSON.stringify(paginationParams)}`);
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.GET_BY_LOCATION_DETAIL_ID, {
        locationDetailId,
        paginationParams
      }),
    );
  }
} 