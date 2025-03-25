import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly usersService: UsersService) { }

  async getAllStaff(paginationParams: PaginationParams = {}) {
    return this.usersService.getAllStaff(paginationParams);
  }

  findAll() {
    return `This action returns all employees`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employee`;
  }

  remove(id: number) {
    return `This action removes a #${id} employee`;
  }
}
