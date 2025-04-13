import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/create-MaintenanceCycle.dto';
import { UpdateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/update-MaintenanceCycle.dto';
import { MaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.dto';
import { MAINTENANCE_CYCLE_PATTERN } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.patterns';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';

@Injectable()
export class MaintenanceCycleService {
  constructor(
    @Inject('SCHEDULE_SERVICE') private readonly scheduleClient: ClientProxy,
  ) {}

  async create(createDto: CreateMaintenanceCycleDto): Promise<MaintenanceCycleDto> {
    return firstValueFrom(
      this.scheduleClient.send(MAINTENANCE_CYCLE_PATTERN.CREATE, createDto),
    );
  }

  async findAll(paginationParams?: PaginationParams) {
    return firstValueFrom(
      this.scheduleClient.send(MAINTENANCE_CYCLE_PATTERN.GET_ALL, paginationParams),
    );
  }

  async findById(cycle_id: string): Promise<MaintenanceCycleDto> {
    return firstValueFrom(
      this.scheduleClient.send(MAINTENANCE_CYCLE_PATTERN.GET_BY_ID, cycle_id),
    );
  }

  async update(cycle_id: string, updateDto: UpdateMaintenanceCycleDto): Promise<MaintenanceCycleDto> {
    return firstValueFrom(
      this.scheduleClient.send(MAINTENANCE_CYCLE_PATTERN.UPDATE, {
        cycle_id,
        updateDto,
      }),
    );
  }

  async delete(cycle_id: string): Promise<MaintenanceCycleDto> {
    return firstValueFrom(
      this.scheduleClient.send(MAINTENANCE_CYCLE_PATTERN.DELETE, cycle_id),
    );
  }
} 