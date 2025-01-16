import { Injectable } from '@nestjs/common';
import { CreateWorkingPositionDto } from './dto/create-working-position.dto';
import { UpdateWorkingPositionDto } from './dto/update-working-position.dto';

@Injectable()
export class WorkingPositionsService {
  create(createWorkingPositionDto: CreateWorkingPositionDto) {
    return 'This action adds a new workingPosition';
  }

  findAll() {
    return `This action returns all workingPositions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workingPosition`;
  }

  update(id: number, updateWorkingPositionDto: UpdateWorkingPositionDto) {
    return `This action updates a #${id} workingPosition`;
  }

  remove(id: number) {
    return `This action removes a #${id} workingPosition`;
  }
}
