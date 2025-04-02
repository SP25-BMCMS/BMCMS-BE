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

  @GrpcMethod('UserService', 'GetUserInfo')
  async getUserInfo(data: { userId?: string; username?: string }) {
    try {
      const response = await this.usersService.getUserInfo(data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  @GrpcMethod('UserService', 'UpdateDepartmentAndWorkingPosition')
  async updateDepartmentAndWorkingPosition(data: {
    staffId: string;
    departmentId: string;
    positionId: string;
  }) {
    try {

      const result = await this.usersService.updateDepartmentAndWorkingPosition(
        data.staffId,
        data.departmentId,
        data.positionId
      );


      // If the service method indicates a failure, throw an RPC exception
      if (!result.isSuccess) {

        // Check for specific "not found" error messages and return 404
        const notFoundKeywords = ['không tìm thấy', 'not found', 'không tồn tại'];
        const isNotFound = notFoundKeywords.some(keyword =>
          result.message.toLowerCase().includes(keyword.toLowerCase())
        );

        throw new RpcException({
          statusCode: isNotFound ? 404 : 500,
          message: result.message || 'Unknown error occurred'
        });
      }

      return result;
    } catch (error) {

      // If it's already an RpcException, rethrow it
      if (error instanceof RpcException) {
        throw error;
      }

      // For other errors, check if it's a "not found" message
      const errorMessage = error.message || 'Lỗi khi cập nhật phòng ban và vị trí công việc';
      const notFoundKeywords = ['không tìm thấy', 'not found', 'không tồn tại'];
      const isNotFound = notFoundKeywords.some(keyword =>
        errorMessage.toLowerCase().includes(keyword.toLowerCase())
      );

      // Otherwise, wrap it in an RpcException
      throw new RpcException({
        statusCode: isNotFound ? 404 : 500,
        message: errorMessage,
        details: error.stack
      });
    }
  }

  @GrpcMethod('UserService', 'GetDepartmentById')
  async getDepartmentById(data: { departmentId: string }) {
    try {
      const result = await this.usersService.getDepartmentById(data.departmentId);
      return result;
    } catch (error) {
      throw error;
    }
  }


}
