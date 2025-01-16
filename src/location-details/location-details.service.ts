import { Injectable } from '@nestjs/common';
import { CreateLocationDetailDto } from './dto/create-location-detail.dto';
import { UpdateLocationDetailDto } from './dto/update-location-detail.dto';

@Injectable()
export class LocationDetailsService {
  create(createLocationDetailDto: CreateLocationDetailDto) {
    return 'This action adds a new locationDetail';
  }

  findAll() {
    return `This action returns all locationDetails`;
  }

  findOne(id: number) {
    return `This action returns a #${id} locationDetail`;
  }

  update(id: number, updateLocationDetailDto: UpdateLocationDetailDto) {
    return `This action updates a #${id} locationDetail`;
  }

  remove(id: number) {
    return `This action removes a #${id} locationDetail`;
  }
}
