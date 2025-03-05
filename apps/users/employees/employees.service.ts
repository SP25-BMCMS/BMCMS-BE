import { Injectable } from '@nestjs/common';
@Injectable()
export class EmployeesService {


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
