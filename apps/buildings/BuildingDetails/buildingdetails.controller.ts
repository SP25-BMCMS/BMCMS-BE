import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {BuildingDetailsService} from './buildingdetails.service';
import { BUILDINGDETAIL_PATTERN } from '@app/contracts/BuildingDetails/buildingdetails.patterns';
import { UUID } from 'crypto';
@Controller('building-details')
export class BuildingDetailsController {

  constructor(private readonly buildingDetailService: BuildingDetailsService) {}

  @MessagePattern(BUILDINGDETAIL_PATTERN.CREATE)
  async createBuildingDetail(@Payload() createBuildingDetailDto: any) {
    return this.buildingDetailService.createBuildingDetail(createBuildingDetailDto);
  }

  @MessagePattern(BUILDINGDETAIL_PATTERN.GET)
  async getAllBuildingDetails() {
    return this.buildingDetailService.getAllBuildingDetails();
  }

  @MessagePattern(BUILDINGDETAIL_PATTERN.GET_BY_ID)
  async getBuildingDetailById(@Payload() payload: { buildingDetailId: string }) {
    return this.buildingDetailService.getBuildingDetailById(payload.buildingDetailId);
  }

  @MessagePattern(BUILDINGDETAIL_PATTERN.UPDATE)
  async updateBuildingDetail(@Payload() payload: any) {
    return this.buildingDetailService.updateBuildingDetail(payload.buildingDetailId, payload);
  }

  @MessagePattern(BUILDINGDETAIL_PATTERN.DELETE)
  async deleteBuildingDetail(@Payload() payload: { buildingDetailId: string }) {
    return this.buildingDetailService.deleteBuildingDetail(payload.buildingDetailId);
  }
}