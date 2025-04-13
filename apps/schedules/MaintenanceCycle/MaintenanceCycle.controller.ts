import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MaintenanceCycleService } from './MaintenanceCycle.service';
import { CreateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/create-MaintenanceCycle.dto';
import { UpdateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/update-MaintenanceCycle.dto';
import { MAINTENANCE_CYCLE_PATTERN } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.patterns';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';

@Controller()
export class MaintenanceCycleController {
  constructor(private readonly maintenanceCycleService: MaintenanceCycleService) {}

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.CREATE)
  create(createDto: CreateMaintenanceCycleDto) {
    return this.maintenanceCycleService.create(createDto);
  }

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.GET_ALL)
  findAll(paginationParams: PaginationParams) {
    return this.maintenanceCycleService.findAll(paginationParams);
  }

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.GET_BY_ID)
  findById(cycle_id: string) {
    return this.maintenanceCycleService.findById(cycle_id);
  }

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.UPDATE)
  update({ cycle_id, updateDto }: { cycle_id: string; updateDto: UpdateMaintenanceCycleDto }) {
    return this.maintenanceCycleService.update(cycle_id, updateDto);
  }

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.DELETE)
  delete(cycle_id: string) {
    return this.maintenanceCycleService.delete(cycle_id);
  }
} 