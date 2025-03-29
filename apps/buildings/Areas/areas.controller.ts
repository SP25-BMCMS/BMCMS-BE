// areas.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AreasService } from './areas.service';
import { AREAS_PATTERN } from 'libs/contracts/src/Areas/Areas.patterns';
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) { }

  @MessagePattern(AREAS_PATTERN.CREATE)
  async createArea(@Payload() createAreaDto: any) {
    return this.areasService.createArea(createAreaDto);
  }

  @MessagePattern(AREAS_PATTERN.GET)
  async getAllAreas(@Payload() paginationParams: PaginationParams) {
    return await this.areasService.getAllAreas(paginationParams);
  }

  @MessagePattern(AREAS_PATTERN.GET_BY_ID)
  async getAreaById(@Payload() payload: { areaId: string }) {
    console.log('AreasController received request for area:', payload.areaId);
    console.log('Full payload:', payload);
    const result = await this.areasService.getAreaById(payload.areaId);
    console.log('AreasController returning result:', result);
    return result;
  }

  @MessagePattern(AREAS_PATTERN.UPDATE)
  async updateArea(@Payload() payload: any) {
    return this.areasService.updateArea(payload.areaId, payload);
  }

  @MessagePattern(AREAS_PATTERN.DELELTE)
  async deleteArea(@Payload() payload: { areaId: string }) {
    return this.areasService.deleteArea(payload.areaId);
  }
}
