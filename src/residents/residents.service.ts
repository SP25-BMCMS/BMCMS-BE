import { Injectable } from '@nestjs/common';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';

@Injectable()
export class ResidentsService {
  create(createResidentDto: CreateResidentDto) {
    return 'This action adds a new resident';
  }

  findAll() {
    return `This action returns all residents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} resident`;
  }

  update(id: number, updateResidentDto: UpdateResidentDto) {
    return `This action updates a #${id} resident`;
  }

  remove(id: number) {
    return `This action removes a #${id} resident`;
  }
}
