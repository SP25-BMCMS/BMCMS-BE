import { Injectable } from '@nestjs/common';

@Injectable()
export class DepartmentsService {
  findAll() {
    return `This action returns all departments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} department`;
  }

  remove(id: number) {
    return `This action removes a #${id} department`;
  }
}
