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
  constructor(private readonly employeesService: EmployeesService) {}

  @GrpcMethod('UserService', 'GetAllStaff')
  async getAllStaff(@Payload() paginationParams: PaginationParams = {}) {
    return this.employeesService.getAllStaff(paginationParams);
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
