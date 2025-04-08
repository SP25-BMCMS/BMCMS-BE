import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DepartmentsService } from './departments.service';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  @GrpcMethod('UserService', 'GetAllDepartments')
  async getAllDepartments() {
    return this.departmentsService.findAll();
  }

}
