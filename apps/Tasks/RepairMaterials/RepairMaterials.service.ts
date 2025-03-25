import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from 'libs/contracts/src/ApiReponse/api-response';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';

@Injectable()
export class RepairMaterialsService {
    constructor(private readonly prisma: PrismaService) { }

    async createRepairMaterial(dto: CreateRepairMaterialDto) {
        try {
            // Kiểm tra tính hợp lệ của inspection
            const existingInspection = await this.prisma.inspection.findUnique({
                where: { inspection_id: dto.inspection_id }
            });

            if (!existingInspection) {
                return new ApiResponse(false, 'Inspection không tồn tại');
            }

            // Kiểm tra tính hợp lệ của material
            const existingMaterial = await this.prisma.material.findUnique({
                where: { material_id: dto.material_id }
            });

            if (!existingMaterial) {
                return new ApiResponse(false, 'Vật liệu không tồn tại');
            }

            // Tạo repair material
            const repairMaterial = await this.prisma.repairMaterial.create({
                data: {
                    task_id: dto.task_id,
                    material_id: dto.material_id,
                    quantity: dto.quantity,
                    unit_cost: dto.unit_cost,
                    total_cost: dto.total_cost,
                    inspection_id: dto.inspection_id
                }
            });

            // Cập nhật số lượng vật liệu trong kho
            await this.prisma.material.update({
                where: { material_id: dto.material_id },
                data: {
                    stock_quantity: {
                        decrement: dto.quantity
                    }
                }
            });

            return new ApiResponse(
                true,
                'Repair Material đã được tạo thành công',
                [repairMaterial]
            );
        } catch (error) {
            console.error('Error creating repair material:', error);
            throw new RpcException(
                new ApiResponse(
                    false,
                    'Lỗi khi tạo repair material',
                    [error.message]
                )
            );
        }
    }
}