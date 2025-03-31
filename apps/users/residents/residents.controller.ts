import { Controller } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { GrpcMethod, Payload } from '@nestjs/microservices';

@Controller()
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) { }

  @GrpcMethod('UserService', 'getAllResidents')
  async getAllResidents() {
    console.log('GRPC: getAllResidents called');
    const result = await this.residentsService.getAllResidents();

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
      data: result.data
    };
  }

  @GrpcMethod('UserService', 'GetApartmentsByResidentId')
  async getApartmentsByResidentId(@Payload() data: { residentId: string }) {
    console.log(`GRPC Controller - getApartmentsByResidentId called with ID: ${data.residentId}`);
    try {
      const result = await this.residentsService.getApartmentsByResidentId(data.residentId);
      console.log('GRPC Controller - Service result detail:', JSON.stringify(result, null, 2));

      // Kiểm tra kỹ dữ liệu trước khi trả về
      const filteredData = result.data?.filter(item => item && Object.keys(item).length > 0) || [];
      console.log(`Filtered ${result.data?.length || 0} to ${filteredData.length} non-empty items`);

      if (filteredData.length === 0 && result.isSuccess) {
        console.log('No valid data found, creating placeholder response');
        return {
          success: true,
          isSuccess: true,
          message: 'No apartments found',
          data: []
        };
      }

      // Đảm bảo tất cả thuộc tính đều có giá trị
      const response = {
        success: true,
        isSuccess: true,
        message: result.message || 'Success',
        data: filteredData.map(item => {
          // Đảm bảo user data đầy đủ
          if (!item.userId) console.warn('Missing userId in response item');
          if (!item.apartments) console.warn('Missing apartments array in response item');

          return {
            userId: item.userId || '',
            username: item.username || '',
            email: item.email || '',
            phone: item.phone || '',
            role: item.role || 'Resident',
            dateOfBirth: item.dateOfBirth || null,
            gender: item.gender || null,
            accountStatus: item.accountStatus || 'Active',
            userDetails: item.userDetails || null,
            apartments: Array.isArray(item.apartments) ? item.apartments : []
          };
        })
      };

      console.log('GRPC Controller - Final response data:',
        response.data.length > 0 ?
          `${response.data.length} items, first item has ${response.data[0].apartments?.length || 0} apartments` :
          'Empty array');

      return response;
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
