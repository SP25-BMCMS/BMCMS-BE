import { Injectable, Inject } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { TASK_CLIENT } from '../constraints'
import { MATERIAL_PATTERN } from '@app/contracts/materials/material.patterns'
import { CreateMaterialDto } from '@app/contracts/materials/create-material.dto'
import { UpdateMaterialDto } from '@app/contracts/materials/update-material.dto'
import { UpdateMaterialStatusDto } from '@app/contracts/materials/update-material-status.dto'
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
import { firstValueFrom } from 'rxjs'
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto'
import { REPAIRMATERIAL_PATTERN } from '@app/contracts/repairmaterials/RepairMaterial.patterns'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { Inspection } from '@prisma/client-Task'

@Injectable()
export class MaterialService {
    constructor(@Inject(TASK_CLIENT) private readonly taskClient: ClientProxy) { }

    async getAllMaterials(paginationParams: PaginationParams) {
        return firstValueFrom(
            this.taskClient.send(MATERIAL_PATTERN.GET_ALL_MATERIALS, paginationParams)
        )
    }

    async getMaterialById(material_id: string) {
        return firstValueFrom(
            this.taskClient.send(MATERIAL_PATTERN.GET_MATERIAL_BY_ID, material_id)
        )
    }

    async createMaterial(createMaterialDto: CreateMaterialDto) {
        return firstValueFrom(
            this.taskClient.send(MATERIAL_PATTERN.CREATE_MATERIAL, createMaterialDto)
        )
    }

    async updateMaterial(material_id: string, updateMaterialDto: UpdateMaterialDto) {
        return firstValueFrom(
            this.taskClient.send(MATERIAL_PATTERN.UPDATE_MATERIAL, {
                material_id,
                dto: updateMaterialDto
            })
        )
    }

    async updateUnitPrice(material_id: string, unit_price: number) {
        return firstValueFrom(
            this.taskClient.send(MATERIAL_PATTERN.UPDATE_UNIT_PRICE, {
                material_id,
                unit_price
            })
        )
    }

    async updateStockQuantity(material_id: string, stock_quantity: number) {
        return firstValueFrom(
            this.taskClient.send(MATERIAL_PATTERN.UPDATE_STOCK_QUANTITY, {
                material_id,
                stock_quantity
            })
        )
    }

    async updateStatus(material_id: string, updateMaterialStatusDto: UpdateMaterialStatusDto) {
        return firstValueFrom(
            this.taskClient.send(MATERIAL_PATTERN.UPDATE_STATUS, {
                material_id,
                dto: updateMaterialStatusDto
            })
        )
    }

    async addMaterialsToInspection(inspection_id: string, materials: CreateRepairMaterialDto[]): Promise<ApiResponse<Inspection>> {
        return firstValueFrom(
            this.taskClient.send(REPAIRMATERIAL_PATTERN.ADD_MATERIALS_TO_INSPECTION, {
                inspection_id,
                materials
            })
        )
    }
} 