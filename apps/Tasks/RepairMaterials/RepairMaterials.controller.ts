import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RepairMaterialsService } from './RepairMaterials.service';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { REPAIRMATERIAL_PATTERN } from '@app/contracts/repairmaterials/RepairMaterial.patterns';
import { AddMaterialsToInspectionDto } from '@app/contracts/repairmaterials/Add-Materials-Inspection';

@Controller('repair-materials')
export class RepairMaterialsController {
  constructor(
    private readonly repairMaterialsService: RepairMaterialsService,
  ) {}

  @MessagePattern(REPAIRMATERIAL_PATTERN.CREATE_REPAIR_MATERIAL)
  async createRepairMaterial(@Payload() dto: CreateRepairMaterialDto) {
    return this.repairMaterialsService.createRepairMaterial(dto);
  }

  @MessagePattern(REPAIRMATERIAL_PATTERN.ADD_MATERIALS_TO_INSPECTION)
  async addMaterialsToInspection(@Payload() payload: { inspection_id: string; materials: AddMaterialsToInspectionDto[] }) {
    return this.repairMaterialsService.addMaterialsToInspection(payload.inspection_id, payload.materials);
  }

  
}
