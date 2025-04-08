import { Controller, Param, Body } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MaterialsService } from './Materials.service';
import { CreateMaterialDto } from '@app/contracts/materials/create-material.dto';
import { UpdateMaterialDto } from '@app/contracts/materials/update-material.dto';
import { UpdateMaterialStatusDto } from '@app/contracts/materials/update-material-status.dto';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { MATERIAL_PATTERN } from '@app/contracts/materials/material.patterns';

@Controller('materials')
export class MaterialsController {
    constructor(private readonly materialsService: MaterialsService) {}

    @MessagePattern(MATERIAL_PATTERN.GET_ALL_MATERIALS)
    async getAllMaterials(@Payload() paginationParams: PaginationParams) {
        return this.materialsService.getAllMaterials(paginationParams);
    }

    @MessagePattern(MATERIAL_PATTERN.GET_MATERIAL_BY_ID)
    async getMaterialById(@Payload() material_id: string) {
        return this.materialsService.getMaterialById(material_id);
    }

    @MessagePattern(MATERIAL_PATTERN.CREATE_MATERIAL)
    async createMaterial(@Payload() dto: CreateMaterialDto) {
        return this.materialsService.createMaterial(dto);
    }

    @MessagePattern(MATERIAL_PATTERN.UPDATE_MATERIAL)
    async updateMaterial(@Payload() data: { material_id: string; dto: UpdateMaterialDto }) {
        return this.materialsService.updateMaterial(data.material_id, data.dto);
    }

    @MessagePattern(MATERIAL_PATTERN.UPDATE_UNIT_PRICE)
    async updateUnitPrice(@Payload() data: { material_id: string; unit_price: number }) {
        return this.materialsService.updateUnitPrice(data.material_id, data.unit_price);
    }

    @MessagePattern(MATERIAL_PATTERN.UPDATE_STOCK_QUANTITY)
    async updateStockQuantity(@Payload() data: { material_id: string; stock_quantity: number }) {
        return this.materialsService.updateStockQuantity(data.material_id, data.stock_quantity);
    }

    @MessagePattern(MATERIAL_PATTERN.UPDATE_STATUS)
    async updateStatus(@Payload() data: { material_id: string; dto: UpdateMaterialStatusDto }) {
        return this.materialsService.updateStatus(data.material_id, data.dto);
    }
}
