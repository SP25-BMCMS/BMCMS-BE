import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from '@app/contracts/materials/create-material.dto';
import { UpdateMaterialDto } from '@app/contracts/materials/update-material.dto';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';

@Injectable()
export class MaterialsService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllMaterials(paginationParams: PaginationParams) {
        const { page = 1, limit = 10, search } = paginationParams;
        const skip = (page - 1) * limit;

        const where = search ? {
            OR: [
                { name: { contains: search } },
                { description: { contains: search } }
            ]
        } : {};

        const [materials, total] = await Promise.all([
            this.prisma.material.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            this.prisma.material.count({ where })
        ]);

        return new ApiResponse(true, 'Materials retrieved successfully', {
            data: materials,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }

    async getMaterialById(material_id: string) {
        const material = await this.prisma.material.findUnique({
            where: { material_id }
        });

        if (!material) {
            return new ApiResponse(false, 'Material not found');
        }

        return new ApiResponse(true, 'Material retrieved successfully', material);
    }

    async createMaterial(dto: CreateMaterialDto) {
        try {
            const material = await this.prisma.material.create({
                data: dto
            });
            return new ApiResponse(true, 'Material created successfully', material);
        } catch (error) {
            return new ApiResponse(false, 'Error creating material', error.message);
        }
    }

    async updateMaterial(material_id: string, dto: UpdateMaterialDto) {
        try {
            const material = await this.prisma.material.update({
                where: { material_id },
                data: dto
            });
            return new ApiResponse(true, 'Material updated successfully', material);
        } catch (error) {
            return new ApiResponse(false, 'Error updating material', error.message);
        }
    }

    async updateUnitPrice(material_id: string, unit_price: number) {
        try {
            const material = await this.prisma.material.update({
                where: { material_id },
                data: { unit_price }
            });
            return new ApiResponse(true, 'Unit price updated successfully', material);
        } catch (error) {
            return new ApiResponse(false, 'Error updating unit price', error.message);
        }
    }

    async updateStockQuantity(material_id: string, quantity_change: number) {
        try {
            // Lấy thông tin material hiện tại
            const currentMaterial = await this.prisma.material.findUnique({
                where: { material_id }
            });

            if (!currentMaterial) {
                return new ApiResponse(false, 'Material not found');
            }

            // Tính toán số lượng mới
            const newQuantity = currentMaterial.stock_quantity + quantity_change;

            // Kiểm tra nếu số lượng mới âm
            if (newQuantity < 0) {
                return new ApiResponse(false, 'Stock quantity cannot be negative');
            }

            // Cập nhật số lượng mới
            const material = await this.prisma.material.update({
                where: { material_id },
                data: { stock_quantity: newQuantity }
            });

            return new ApiResponse(true, 'Stock quantity updated successfully', material);
        } catch (error) {
            return new ApiResponse(false, 'Error updating stock quantity', error.message);
        }
    }
}
