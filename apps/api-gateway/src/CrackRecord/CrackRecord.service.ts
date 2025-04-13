import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CRACK_RECORD_PATTERNS } from '@app/contracts/CrackRecord/CrackRecord.patterns';
import { CreateCrackRecordDto } from '@app/contracts/CrackRecord/create-CrackRecord.dto';
import { UpdateCrackRecordDto } from '@app/contracts/CrackRecord/update-CrackRecord.dto';
import { CrackRecordDto } from '@app/contracts/CrackRecord/CrackRecord.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';
import { BUILDING_CLIENT } from '../constraints';

@Injectable()
export class CrackRecordService {
  constructor(
    @Inject(BUILDING_CLIENT) private readonly buildingService: ClientProxy,
  ) {}

  async create(createDto: CreateCrackRecordDto): Promise<ApiResponse<CrackRecordDto>> {
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.CREATE, createDto),
    );
  }

  async findAll(
    page?: number,
    limit?: number,
    search?: string,
  ): Promise<ApiResponse<CrackRecordDto[]>> {
    const paginationParams = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search || '',
    };

    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.GET_ALL, paginationParams),
    );
  }

  async findOne(id: string): Promise<ApiResponse<CrackRecordDto>> {
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.GET_BY_ID, id),
    );
  }

  async update(
    id: string,
    updateDto: UpdateCrackRecordDto,
  ): Promise<ApiResponse<CrackRecordDto>> {
    return firstValueFrom(
      this.buildingService.send(CRACK_RECORD_PATTERNS.UPDATE, { id, updateDto }),
    );
  }

  async remove(id: string): Promise<ApiResponse<CrackRecordDto>> {
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
} 