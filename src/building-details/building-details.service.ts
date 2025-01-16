import { Injectable } from '@nestjs/common';
import { CreateBuildingDetailDto } from './dto/create-building-detail.dto';
import { UpdateBuildingDetailDto } from './dto/update-building-detail.dto';

@Injectable()
export class BuildingDetailsService {
  create(createBuildingDetailDto: CreateBuildingDetailDto) {
    return 'This action adds a new buildingDetail';
  }

  findAll() {
    return `This action returns all buildingDetails`;
  }

  findOne(id: number) {
    return `This action returns a #${id} buildingDetail`;
  }

  update(id: number, updateBuildingDetailDto: UpdateBuildingDetailDto) {
    return `This action updates a #${id} buildingDetail`;
  }

  remove(id: number) {
    return `This action removes a #${id} buildingDetail`;
  }
}
