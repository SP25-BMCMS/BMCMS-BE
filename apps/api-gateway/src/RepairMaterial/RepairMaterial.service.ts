import {
  Body,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints';
import { catchError, firstValueFrom } from 'rxjs';
import { REPAIRMATERIAL_PATTERN } from 'libs/contracts/src/repairmaterials/RepairMaterial.patterns';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class RepairMaterialService {
  constructor(@Inject(TASK_CLIENT) private readonly taskClient: ClientProxy) {}

  async createRepairMaterial(createRepairMaterialDto: CreateRepairMaterialDto) {
    try {
      return await firstValueFrom(
        this.taskClient.send(
          REPAIRMATERIAL_PATTERN.CREATE_REPAIR_MATERIAL,
          createRepairMaterialDto,
        ),
      );
    } catch (error) {
      throw new HttpException(
        'Error occurred while creating repair material',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
