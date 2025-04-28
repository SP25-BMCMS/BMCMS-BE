import { ApartmentDTO } from '@app/contracts/Apartments/Apartments.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { PrismaClient } from '@prisma/client-users'

@Injectable()
export class ApartmentsService {
  private prisma = new PrismaClient();

  async getApartmentById(
    apartmentId: string,
  ): Promise<ApiResponse<ApartmentDTO>> {
    try {
      const apartment = await this.prisma.apartment.findUnique({
        where: { apartmentId }, // Truy vấn Apartment theo apartmentId
      })

      if (!apartment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy căn hộ',
        })
      }

      return new ApiResponse<ApartmentDTO>(
        true,
        'Lấy thông tin căn hộ thành công',
        apartment,
      )
    } catch (error) {
      console.error('Error retrieving apartment:', error)
      if (error instanceof RpcException) {
        throw error // Re-throw the RpcException if it's already one
      }
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi máy chủ nội bộ',
      })
    }
  }
}
