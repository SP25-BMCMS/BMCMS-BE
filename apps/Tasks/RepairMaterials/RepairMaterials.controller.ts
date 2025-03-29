import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RepairMaterialsService } from './RepairMaterials.service';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { REPAIRMATERIAL_PATTERN } from 'libs/contracts/src/repairmaterials/RepairMaterial.patterns';
@Controller('repair-materials')
export class RepairMaterialsController {
  constructor(
    private readonly repairMaterialsService: RepairMaterialsService,
  ) {}

  @MessagePattern(REPAIRMATERIAL_PATTERN.CREATE_REPAIR_MATERIAL)
  async createRepairMaterial(@Payload() dto: CreateRepairMaterialDto) {
    return this.repairMaterialsService.createRepairMaterial(dto);
  }
}
