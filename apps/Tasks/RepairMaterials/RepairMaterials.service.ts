import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { PrismaService } from '../prisma/prisma.service'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto'
import { Prisma } from '@prisma/client'
import { Inspection } from '@prisma/client-Task'
import { AddMaterialsToInspectionDto } from '@app/contracts/repairmaterials/Add-Materials-Inspection'

@Injectable()
export class RepairMaterialsService {
  constructor(private readonly prisma: PrismaService) { }

  async createRepairMaterial(dto: CreateRepairMaterialDto) {
    try {
      // Kiểm tra tính hợp lệ của inspection
      const existingInspection = await this.prisma.inspection.findUnique({
        where: { inspection_id: dto.inspection_id },
      })

      if (!existingInspection) {
        return new ApiResponse(false, 'Không tồn tại kiểm tra')
      }

      // Kiểm tra tính hợp lệ của material
      const existingMaterial = await this.prisma.material.findUnique({
        where: { material_id: dto.material_id },
      })

      if (!existingMaterial) {
        return new ApiResponse(false, 'Không tồn tại vật liệu')
      }

      // Tạo repair material
      const repairMaterial = await this.prisma.repairMaterial.create({
        data: {
          material_id: dto.material_id,
          quantity: dto.quantity,
          unit_cost: dto.unit_cost,
          total_cost: dto.total_cost,
          inspection_id: dto.inspection_id,
        },
      })

      // Cập nhật số lượng vật liệu trong kho
      await this.prisma.material.update({
        where: { material_id: dto.material_id },
        data: {
          stock_quantity: {
            decrement: dto.quantity,
          },
        },
      })

      return new ApiResponse(true, 'Vật liệu sửa chữa đã được tạo thành công', [
        repairMaterial,
      ])
    } catch (error) {
      console.error('Error creating repair material:', error)
      throw new RpcException(
        new ApiResponse(false, 'Lỗi khi tạo vật liệu sửa chữa', [error.message]),
      )
    }
  }

  async addMaterialsToInspection(inspection_id: string, materials: AddMaterialsToInspectionDto[]) {
    try {
      // Bắt đầu transaction
      return await this.prisma.$transaction(async (prisma) => {
        let totalCost = 0

        // Lặp qua từng material
        for (const material of materials) {
          // Lấy thông tin material
          const materialInfo = await prisma.material.findUnique({
            where: { material_id: material.material_id }
          })

          if (!materialInfo) {
            throw new Error(`Không tìm thấy vật liệu với ID ${material.material_id}`)
          }

          // Kiểm tra số lượng tồn kho
          if (materialInfo.stock_quantity < material.quantity) {
            throw new Error(`Không đủ số lượng tồn kho cho vật liệu ${materialInfo.name}. Số lượng hiện có: ${materialInfo.stock_quantity}, Yêu cầu: ${material.quantity}`)
          }

          // Tính toán chi phí
          const unitCost = Number(materialInfo.unit_price)
          const materialTotalCost = unitCost * material.quantity
          totalCost += materialTotalCost

          // Tạo repair material
          await prisma.repairMaterial.create({
            data: {
              material_id: material.material_id,
              quantity: material.quantity,
              unit_cost: unitCost,
              total_cost: materialTotalCost,
              inspection_id: inspection_id
            }
          })

          // Cập nhật số lượng tồn kho
          await prisma.material.update({
            where: { material_id: material.material_id },
            data: {
              stock_quantity: materialInfo.stock_quantity - material.quantity
            }
          })
        }

        // Cập nhật tổng chi phí cho inspection
        const updatedInspection = await prisma.inspection.update({
          where: { inspection_id },
          data: { total_cost: totalCost },
          include: {
            repairMaterials: {
              include: {
                material: true
              }
            }
          }
        })

        return new ApiResponse<Inspection>(true, 'Đã thêm vật liệu vào báo cáo thành công', updatedInspection)
      })
    } catch (error) {
      return new ApiResponse<Inspection>(false, 'Lỗi khi thêm vật liệu vào báo cáo', error.message)
    }
  }
}
