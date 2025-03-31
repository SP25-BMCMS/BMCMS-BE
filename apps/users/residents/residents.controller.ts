import { Controller } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { GrpcMethod, Payload } from '@nestjs/microservices';

@Controller()
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) { }

  @GrpcMethod('UserService', 'getAllResidents')
  async getAllResidents(@Payload() paginationParams: { page?: number; limit?: number; search?: string }) {
    const result = await this.residentsService.getAllResidents(paginationParams);

    // Kiểm tra xem có dữ liệu trả về không
    if (result.isSuccess && Array.isArray(result.data)) {
      result.data.forEach(resident => {
        if (resident.apartments && Array.isArray(resident.apartments)) {
          resident.apartments.forEach(apt => {
            console.log(`Apartment ${apt.apartmentName}:`,
              'Has buildingDetails:', !!apt.buildingDetails,
              'Building info:', apt.buildingDetails?.building ?
              `ID: ${apt.buildingDetails.building.buildingId}, Name: ${apt.buildingDetails.building.name}` : 'null'
            );
          });
        }
      });
    }

    return {
      success: true,
      message: result.message,
      data: result.data,
      pagination: result.pagination
    };
  }

  @GrpcMethod('UserService', 'GetApartmentsByResidentId')
  async getApartmentsByResidentId(@Payload() data: { residentId: string }) {
    console.log(`GRPC Controller - getApartmentsByResidentId called with ID: ${data.residentId}`);
    try {
      const result = await this.residentsService.getApartmentsByResidentId(data.residentId);

      // Log chi tiết kết quả cho debugging
      console.log('GRPC Controller - Service result structure:', {
        isSuccess: result.isSuccess,
        message: result.message,
        dataLength: result.data?.length || 0,
        dataType: result.data ? (Array.isArray(result.data) ? 'array' : typeof result.data) : 'undefined'
      });

      // Log mẫu dữ liệu đầu tiên nếu có
      if (result.data?.length > 0) {
        const firstItem = result.data[0];
        console.log('First apartment data:', {
          apartmentId: firstItem.apartmentId,
          apartmentName: firstItem.apartmentName,
          hasApartmentId: !!firstItem.apartmentId,
          keys: Object.keys(firstItem)
        });
      }

      // Trả về kết quả trực tiếp từ service, không cần xử lý thêm
      // Service đã trả về đúng cấu trúc cho proto definition
      return {
        success: true,
        isSuccess: true,
        message: result.message || 'Success',
        data: result.data || []
      };
    } catch (error) {
      console.error('GRPC Controller - Error in getApartmentsByResidentId:', error);
      return {
        success: false,
        isSuccess: false,
        message: error.message || 'Error retrieving apartments',
        data: []
      };
    }
  }

  @GrpcMethod('UserService', 'GetApartmentByResidentAndApartmentId')
  async getApartmentByResidentAndApartmentId(@Payload() data: { residentId: string, apartmentId: string }) {
    console.log(`GRPC Controller - getApartmentByResidentAndApartmentId called with residentId: ${data.residentId}, apartmentId: ${data.apartmentId}`);
    try {
      const result = await this.residentsService.getApartmentByResidentAndApartmentId(data.residentId, data.apartmentId);

      console.log('GRPC Controller - Apartment result:', JSON.stringify({
        isSuccess: result.isSuccess,
        hasData: !!result.data
      }));

      return {
        isSuccess: result.isSuccess,
        success: result.success,
        message: result.message,
        data: result.data
      };
    } catch (error) {
      console.error('GRPC Controller - Error in getApartmentByResidentAndApartmentId:', error);
      return {
        isSuccess: false,
        success: false,
        message: error.message || 'Error retrieving apartment',
        data: null
      };
    }
  }
}
