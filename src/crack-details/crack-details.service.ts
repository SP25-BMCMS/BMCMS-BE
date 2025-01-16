import { Injectable } from '@nestjs/common';
import { CreateCrackDetailDto } from './dto/create-crack-detail.dto';
import { UpdateCrackDetailDto } from './dto/update-crack-detail.dto';

@Injectable()
export class CrackDetailsService {
  create(createCrackDetailDto: CreateCrackDetailDto) {
    return 'This action adds a new crackDetail';
  }

  findAll() {
    return `This action returns all crackDetails`;
  }

  findOne(id: number) {
    return `This action returns a #${id} crackDetail`;
  }

  update(id: number, updateCrackDetailDto: UpdateCrackDetailDto) {
    return `This action updates a #${id} crackDetail`;
  }

  remove(id: number) {
    return `This action removes a #${id} crackDetail`;
  }
}
