import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { MAINTENANCE_CYCLE_PATTERN } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.patterns'
import { CreateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/create-MaintenanceCycle.dto'
import { UpdateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/update-MaintenanceCycle.dto'
import { MaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.dto'
import { MaintenanceCycleHistoryDto } from '@app/contracts/MaintenanceCycle/MaintenanceCycleHistory.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { PaginationParams, PaginationResponseDto } from '@app/contracts/Pagination/pagination.dto'
import { DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-schedule'
import { SCHEDULE_CLIENT } from '../constraints'

@Injectable()
export class MaintenanceCycleService {
  private readonly logger = new Logger(MaintenanceCycleService.name);

  constructor(@Inject(SCHEDULE_CLIENT) private readonly client: ClientProxy) { }

  async create(createDto: CreateMaintenanceCycleDto): Promise<ApiResponse<MaintenanceCycleDto>> {
    this.logger.log(`Sending create request to microservice: ${JSON.stringify(createDto)}`)
    return this.client.send(MAINTENANCE_CYCLE_PATTERN.CREATE, createDto).toPromise()
  }

  async findAll(
    paginationParams?: PaginationParams,
    device_type?: DeviceType,
    basis?: MaintenanceBasis,
    frequency?: Frequency
  ): Promise<PaginationResponseDto<MaintenanceCycleDto>> {
    this.logger.log(`Sending findAll request to microservice with filters: ${JSON.stringify({
      paginationParams,
      device_type,
      basis,
      frequency
    })}`)
    return this.client.send(MAINTENANCE_CYCLE_PATTERN.GET_ALL, {
      paginationParams,
      device_type,
      basis,
      frequency
    }).toPromise()
  }

  async findById(id: string): Promise<ApiResponse<MaintenanceCycleDto>> {
    this.logger.log(`Sending findById request to microservice: ${id}`)
    return this.client.send(MAINTENANCE_CYCLE_PATTERN.GET_BY_ID, id).toPromise()
  }

  async update(id: string, updateDto: UpdateMaintenanceCycleDto): Promise<ApiResponse<MaintenanceCycleDto>> {
    this.logger.log(`Sending update request to microservice: ${id}, ${JSON.stringify(updateDto)}`)
    return this.client.send(MAINTENANCE_CYCLE_PATTERN.UPDATE, { cycle_id: id, updateDto }).toPromise()
  }

  async delete(id: string): Promise<ApiResponse<MaintenanceCycleDto>> {
    this.logger.log(`Sending delete request to microservice: ${id}`)
    return this.client.send(MAINTENANCE_CYCLE_PATTERN.DELETE, id).toPromise()
  }

  async getHistory(id: string): Promise<ApiResponse<MaintenanceCycleHistoryDto[]>> {
    this.logger.log(`Sending get history request to microservice: ${id}`)
    return this.client.send(MAINTENANCE_CYCLE_PATTERN.GET_HISTORY, id).toPromise()
  }
} 