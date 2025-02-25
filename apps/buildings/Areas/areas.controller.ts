// areas.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AreasService } from './areas.service';
import { AREAS_PATTERN } from 'libs/contracts/src/Areas/Areas.patterns';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @MessagePattern(AREAS_PATTERN.CREATE)
  async createArea(@Payload() createAreaDto: any) {
    return this.areasService.createArea(createAreaDto);
  }

  @MessagePattern(AREAS_PATTERN.GET)
  async getAllAreas() {
    console.log("🚀 ~ AreasController ~ getAllAreas ~ getAllAreas:")
    
    return await this.areasService.getAllAreas();
  }

  @MessagePattern(AREAS_PATTERN.GET_BY_ID)
  async getAreaById(@Payload() payload: { areaId: string }) {
    return this.areasService.getAreaById(payload.areaId);
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
