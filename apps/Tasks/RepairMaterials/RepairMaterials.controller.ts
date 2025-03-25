import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RepairMaterialsService } from './RepairMaterials.service';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { TASKS_PATTERN } from 'libs/contracts/src/tasks/task.patterns';
@Controller('repair-materials')
export class RepairMaterialsController {
    constructor(private readonly repairMaterialsService: RepairMaterialsService) { }

    @MessagePattern(TASKS_PATTERN.CREATE_REPAIR_MATERIAL)
    async createRepairMaterial(@Payload() dto: CreateRepairMaterialDto) {
        return this.repairMaterialsService.createRepairMaterial(dto);
    }
}