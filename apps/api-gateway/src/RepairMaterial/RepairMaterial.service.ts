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
import { REPAIRMATERIAL_PATTERN } from '@app/contracts/repairmaterials/RepairMaterial.patterns';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { Inspection } from '@prisma/client-Task';
import { AddMaterialsToInspectionDto } from '@app/contracts/repairmaterials/Add-Materials-Inspection';

@Injectable()
export class RepairMaterialService {
  constructor(@Inject(TASK_CLIENT) private readonly taskClient: ClientProxy) {}

  async createRepairMaterial(dto: CreateRepairMaterialDto) {
    try {
      return await firstValueFrom(
        this.taskClient.send(REPAIRMATERIAL_PATTERN.CREATE_REPAIR_MATERIAL, dto)
      );
    } catch (error) {
      return new ApiResponse(false, 'Error creating repair material', error.message);
    }
  }

  async addMaterialsToInspection(inspection_id: string, materials: AddMaterialsToInspectionDto[]): Promise<ApiResponse<Inspection>> {
    try {
      return await firstValueFrom(
        this.taskClient.send(REPAIRMATERIAL_PATTERN.ADD_MATERIALS_TO_INSPECTION, {
          inspection_id,
          materials
        })
      );
    } catch (error) {
      return new ApiResponse<Inspection>(false, 'Error adding materials to inspection', error.message);
    }
  }
}
