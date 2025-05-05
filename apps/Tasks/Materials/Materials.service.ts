import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMaterialDto } from '@app/contracts/materials/create-material.dto'
import { UpdateMaterialDto } from '@app/contracts/materials/update-material.dto'
import { UpdateMaterialStatusDto } from '@app/contracts/materials/update-material-status.dto'
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { MaterialStatus } from '@prisma/client-Task'

@Injectable()
export class MaterialsService {
    constructor(private readonly prisma: PrismaService) { }

    async getAllMaterials(paginationParams: PaginationParams) {
        const { page = 1, limit = 10, search } = paginationParams
        const skip = (page - 1) * limit
        const statusFilter = paginationParams?.statusFilter
        const whereFilter = statusFilter ? { status: statusFilter as MaterialStatus } : {}

        const whereSearch = search ? {
            OR: [
                { name: { contains: search } },
                { description: { contains: search } }
            ]
        } : {}

        const [materials, total] = await Promise.all([
            this.prisma.material.findMany({
                where: { ...whereSearch, ...whereFilter },
                skip,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            this.prisma.material.count({ where: { ...whereSearch, ...whereFilter } })
        ])

        return new ApiResponse(true, 'Lấy danh sách vật liệu thành công', {
            data: materials,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    }

    async getMaterialById(material_id: string) {
        const material = await this.prisma.material.findUnique({
            where: { material_id }
        })

        if (!material) {
            return new ApiResponse(false, 'Không tìm thấy vật liệu')
        }

        return new ApiResponse(true, 'Lấy thông tin vật liệu thành công', material)
    }

    async createMaterial(dto: CreateMaterialDto) {
        try {
            const material = await this.prisma.material.create({
                data: dto
            })
            return new ApiResponse(true, 'Tạo vật liệu thành công', material)
        } catch (error) {
            return new ApiResponse(false, 'Lỗi khi tạo vật liệu', error.message)
        }
    }

    async updateMaterial(material_id: string, dto: UpdateMaterialDto) {
        try {
            const material = await this.prisma.material.update({
                where: { material_id },
                data: dto
            })
            return new ApiResponse(true, 'Cập nhật vật liệu thành công', material)
        } catch (error) {
            return new ApiResponse(false, 'Lỗi khi cập nhật vật liệu', error.message)
        }
    }

    async updateUnitPrice(material_id: string, unit_price: number) {
        try {
            const material = await this.prisma.material.update({
                where: { material_id },
                data: { unit_price }
            })
            return new ApiResponse(true, 'Cập nhật đơn giá thành công', material)
        } catch (error) {
            return new ApiResponse(false, 'Lỗi khi cập nhật đơn giá', error.message)
        }
    }

    async updateStockQuantity(material_id: string, quantity_change: number) {
        try {
            // Lấy thông tin material hiện tại
            const currentMaterial = await this.prisma.material.findUnique({
                where: { material_id }
            })

            if (!currentMaterial) {
                return new ApiResponse(false, 'Không tìm thấy vật liệu')
            }

            // Tính toán số lượng mới
            const newQuantity = currentMaterial.stock_quantity + quantity_change

            // Kiểm tra nếu số lượng mới âm
            if (newQuantity < 0) {
                return new ApiResponse(false, 'Số lượng tồn kho không thể âm')
            }

            // Cập nhật số lượng mới
            const material = await this.prisma.material.update({
                where: { material_id },
                data: { stock_quantity: newQuantity }
            })

            return new ApiResponse(true, 'Cập nhật số lượng tồn kho thành công', material)
        } catch (error) {
            return new ApiResponse(false, 'Lỗi khi cập nhật số lượng tồn kho', error.message)
        }
    }

    async updateStatus(material_id: string, dto: UpdateMaterialStatusDto) {
        try {
            const material = await this.prisma.material.update({
                where: { material_id },
                data: { status: dto.status }
            })
            return new ApiResponse(true, 'Cập nhật trạng thái vật liệu thành công', material)
        } catch (error) {
            return new ApiResponse(false, 'Lỗi khi cập nhật trạng thái vật liệu', error.message)
        }
    }
}
