import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { RpcException } from '@nestjs/microservices';
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @GrpcMethod('UserService', 'GetAllStaff')
  async getAllStaff(paginationParams: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string[];
  } = {}) {
    return this.usersService.getAllStaff(paginationParams);
  }

  @GrpcMethod('UserService', 'UpdateResidentApartments')
  async updateResidentApartments(data: {
    residentId: string;
    apartments: { apartmentName: string; buildingDetailId: string }[];
  }) {
    try {
      console.log("Users microservice received request:", JSON.stringify(data, null, 2));

      const response = await this.usersService.updateResidentApartments(
        data.residentId,
        data.apartments,
      );

      // Log the response data
      if (response.data && response.data.apartments && response.data.apartments.length > 0) {
        console.log("Microservice response apartments:", JSON.stringify(response.data.apartments.map(apt => ({
          id: apt.apartmentId,
          name: apt.apartmentName,
          warrantyDate: apt.warrantyDate
        })), null, 2));
      }

      console.log("Users microservice sending response:", JSON.stringify(response, null, 2));

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

  @GrpcMethod('users.UserService', 'GetUserById')
  async getUserById(data: { userId: string }) {
    try {
      const response = await this.usersService.getUserById(data.userId);
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

      if (!result.isSuccess) {
        const notFoundKeywords = ['không tìm thấy', 'not found', 'không tồn tại'];
        const isNotFound = notFoundKeywords.some(keyword =>
          result.message.toLowerCase().includes(keyword.toLowerCase())
        );

        throw new RpcException({
          statusCode: isNotFound ? 404 : 500,
          message: result.message || 'Lỗi không xác định đã xảy ra'
        });
      }

      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const errorMessage = error.message || 'Lỗi khi cập nhật phòng ban và vị trí công việc';
      const notFoundKeywords = ['không tìm thấy', 'not found', 'không tồn tại'];
      const isNotFound = notFoundKeywords.some(keyword =>
        errorMessage.toLowerCase().includes(keyword.toLowerCase())
      );

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
      const result = await this.usersService.getDepartmentById(data);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @GrpcMethod('UserService', 'CheckStaffAreaMatchWithScheduleJob')
  async checkStaffAreaMatchWithScheduleJob(data: { staffId: string; scheduleJobId: string }) {
    try {
      console.log('Received CheckStaffAreaMatchWithScheduleJob request:', data);
      const result = await this.usersService.checkStaffAreaMatchWithScheduleJob(data);
      console.log('CheckStaffAreaMatchWithScheduleJob result:', result);
      return result;
    } catch (error) {
      console.error('Error in CheckStaffAreaMatchWithScheduleJob:', error);
      throw new RpcException({
        statusCode: 500,
        message: `Lỗi khi kiểm tra khu vực của nhân viên với lịch công việc: ${error.message}`,
      });
    }
  }

  @GrpcMethod('UserService', 'GetUserByIdForTaskAssignmentDetail')
  async getUserByIdForTaskAssignmentDetail(data: { userId: string }) {
    try {
      const response = await this.usersService.getUserByIdForTaskAssignmentDetail(data.userId);
      return response;
    } catch (error) {
      throw error;
    }
  }

  @GrpcMethod('UserService', 'CheckUserExists')
  async checkUserExists(data: { userId: string; role?: string }) {
    try {
      const user = await this.usersService.checkUserExists(data.userId, data.role);
      return {
        exists: !!user,
        message: user ? `Tìm thấy người dùng với ID ${data.userId}` : `Không tìm thấy người dùng với ID ${data.userId}${data.role ? ` có vai trò ${data.role}` : ''}`,
        data: user ? { userId: user.userId, role: user.role } : null
      };
    } catch (error) {
      console.error('Error checking user existence:', error);
      throw new RpcException({
        statusCode: 500,
        message: `Lỗi khi kiểm tra sự tồn tại của người dùng: ${error.message}`,
      });
    }
  }

  @GrpcMethod('UserService', 'GetWorkingPositionById')
  async getWorkingPositionById(data: { positionId: string }) {
    try {
      console.log(`GetWorkingPositionById called with positionId: ${data.positionId}`);
      const result = await this.usersService.getWorkingPositionById(data);
      console.log(`Position result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      console.error(`Error in GetWorkingPositionById: ${error.message}`, error.stack);
      throw new RpcException({
        statusCode: error.statusCode || 500,
        message: error.message || 'Lỗi khi lấy thông tin vị trí công việc',
      });
    }
  }
}
