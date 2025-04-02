import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { RpcException } from '@nestjs/microservices';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @GrpcMethod('UserService', 'GetAllStaff')
  async getAllStaff() {
    return this.usersService.getAllStaff();
  }

  @GrpcMethod('UserService', 'UpdateResidentApartments')
  async updateResidentApartments(data: {
    residentId: string;
    apartments: { apartmentName: string; buildingDetailId: string }[];
  }) {
    try {
      const response = await this.usersService.updateResidentApartments(
        data.residentId,
        data.apartments,
      );

      if (!response.isSuccess) {
        throw new RpcException({
          statusCode: response.message.includes('Không tìm thấy') ? 404 : 400,
          message: response.message,
        });
      }

      return response;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi cập nhật căn hộ',
      });
    }
  }

  @GrpcMethod('UserService', 'CheckStaffAreaMatch')
  async checkStaffAreaMatch(data: { staffId: string; crackReportId: string }) {
    return this.usersService.checkStaffAreaMatch(data.staffId, data.crackReportId);
  }
}
