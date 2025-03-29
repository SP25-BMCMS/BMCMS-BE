import { ApartmentDTO } from '@app/contracts/Apartments/Apartments.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client-users';

@Injectable()
export class ApartmentsService {
  private prisma = new PrismaClient();

  async getApartmentById(
    apartmentId: string,
  ): Promise<ApiResponse<ApartmentDTO>> {
    try {
      const apartment = await this.prisma.apartment.findUnique({
        where: { apartmentId }, // Truy vấn Apartment theo apartmentId
      });

      if (!apartment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Apartment not found',
        });
      }

      return new ApiResponse<ApartmentDTO>(
        true,
        'WorkLog By Id successfully',
        apartment,
      );
    } catch (error) {
      console.error('Error retrieving apartment:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Apartment not found',
      });
    }
  }
}
