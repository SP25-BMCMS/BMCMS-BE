import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @GrpcMethod('UserService', 'GetAllStaffByStaffLeader')
  async getAllStaffByStaffLeader(@Payload() request: { staffId: string }) {
    try {
      console.log('Received gRPC request for GetAllStaffByStaffLeader:', request);
      const result = await this.employeesService.getAllStaffByStaffLeader(request.staffId);
      console.log('Sending gRPC response:', result);
      return result;
    } catch (error) {
      console.error('Error in gRPC GetAllStaffByStaffLeader:', error);
      return {
        isSuccess: false,
        message: error.message || 'Dịch vụ không khả dụng',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }
  }

  @GrpcMethod('UserService', 'GetAllStaff')
  async getAllStaff(@Payload() paginationParams: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string[];
  } = {}) {
    return this.employeesService.getAllStaff(paginationParams);
  }

  @GrpcMethod('UserService', 'GetStaffLeaderByCrackReport')
  async getStaffLeaderByCrackReport(@Payload() request: { crackReportId: string }) {
    try {
      console.log('Received gRPC request for GetStaffLeaderByCrackReport:', request);
      const result = await this.employeesService.getStaffLeaderByCrackReport(request.crackReportId);
      console.log('Sending gRPC response for GetStaffLeaderByCrackReport');
      return result;
    } catch (error) {
      console.error('Error in gRPC GetStaffLeaderByCrackReport:', error);
      return {
        isSuccess: false,
        message: error.message || 'Dịch vụ không khả dụng',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }
  }

  @GrpcMethod('UserService', 'GetStaffLeaderByScheduleJob')
  async getStaffLeaderByScheduleJob(@Payload() request: { scheduleJobId: string }) {
    try {
      console.log('Received gRPC request for GetStaffLeaderByScheduleJob:', request);
      const result = await this.employeesService.getStaffLeaderByScheduleJob(request.scheduleJobId);
      console.log('Sending gRPC response for GetStaffLeaderByScheduleJob');
      return result;
    } catch (error) {
      console.error('Error in gRPC GetStaffLeaderByScheduleJob:', error);
      return {
        isSuccess: false,
        message: error.message || 'Dịch vụ không khả dụng',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }
  }

  @GrpcMethod('UserService', 'GetAllStaffByDepartmentType')
  async getAllStaffByDepartmentType(@Payload() request: { staffId: string, departmentType: string }) {
    try {
      console.log('Received gRPC request for GetAllStaffByDepartmentType:', request);
      const result = await this.employeesService.getAllStaffByDepartmentType(
        request.staffId,
        request.departmentType
      );
      console.log('Sending gRPC response for GetAllStaffByDepartmentType');
      return result;
    } catch (error) {
      console.error('Error in gRPC GetAllStaffByDepartmentType:', error);
      return {
        isSuccess: false,
        message: error.message || 'Dịch vụ không khả dụng',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }
  }

  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(+id);
  }
}
