import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MaintenanceCycleService } from './MaintenanceCycle.service';
import { CreateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/create-MaintenanceCycle.dto';
import { UpdateMaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/update-MaintenanceCycle.dto';
import { MaintenanceCycleDto } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';
import { PaginationParams, PaginationResponseDto } from '@app/contracts/Pagination/pagination.dto';
import { DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-Schedule';
import { MAINTENANCE_CYCLE_PATTERN } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.patterns';

@Controller()
export class MaintenanceCycleController {
  private readonly logger = new Logger(MaintenanceCycleController.name);

  constructor(private readonly maintenanceCycleService: MaintenanceCycleService) {}

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.CREATE)
  async create(@Payload() createDto: CreateMaintenanceCycleDto): Promise<ApiResponse<MaintenanceCycleDto>> {
    this.logger.log(`Creating maintenance cycle: ${JSON.stringify(createDto)}`);
    return this.maintenanceCycleService.create(createDto);
  }

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.GET_ALL)
  async findAll(
    @Payload() data: {
      paginationParams?: PaginationParams;
      device_type?: DeviceType;
      basis?: MaintenanceBasis;
      frequency?: Frequency;
    }
  ): Promise<PaginationResponseDto<MaintenanceCycleDto>> {
    this.logger.log(`Finding all maintenance cycles with filters: ${JSON.stringify(data)}`);
    return this.maintenanceCycleService.findAll(
      data.paginationParams,
      data.device_type,
      data.basis,
      data.frequency
    );
  }

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.GET_BY_ID)
  async findById(@Payload() cycle_id: string): Promise<ApiResponse<MaintenanceCycleDto>> {
    this.logger.log(`Finding maintenance cycle by ID: ${cycle_id}`);
    return this.maintenanceCycleService.findById(cycle_id);
  }

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.UPDATE)
  async update(
    @Payload() data: { cycle_id: string; updateDto: UpdateMaintenanceCycleDto }
  ): Promise<ApiResponse<MaintenanceCycleDto>> {
    this.logger.log(`Updating maintenance cycle ${data.cycle_id}: ${JSON.stringify(data.updateDto)}`);
    return this.maintenanceCycleService.update(data.cycle_id, data.updateDto);
  }

  @MessagePattern(MAINTENANCE_CYCLE_PATTERN.DELETE)
  async delete(@Payload() cycle_id: string): Promise<ApiResponse<MaintenanceCycleDto>> {
    this.logger.log(`Deleting maintenance cycle: ${cycle_id}`);
    return this.maintenanceCycleService.delete(cycle_id);
  }
} 