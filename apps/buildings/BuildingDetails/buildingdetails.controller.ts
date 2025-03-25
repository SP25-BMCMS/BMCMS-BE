import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {BuildingDetailsService} from './buildingdetails.service';
import { UUID } from 'crypto';
import { BUILDINGDETAIL_PATTERN } from 'libs/contracts/src/BuildingDetails/buildingdetails.patterns';
import { CreateBuildingDetailDto } from 'libs/contracts/src/BuildingDetails/create-buildingdetails.dto';
import { UpdateBuildingDetailDto } from 'libs/contracts/src/BuildingDetails/update.buildingdetails';
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Controller('building-details')
export class BuildingDetailsController {

  constructor(private readonly buildingDetailService: BuildingDetailsService) {}

  @MessagePattern(BUILDINGDETAIL_PATTERN.CREATE)
  async createBuildingDetail(@Payload() createBuildingDetailDto: any) {
    return this.buildingDetailService.createBuildingDetail(createBuildingDetailDto);
  }

  @MessagePattern(BUILDINGDETAIL_PATTERN.GET)
  async getAllBuildingDetails(@Payload() paginationParams: PaginationParams) {
    return this.buildingDetailService.getAllBuildingDetails(paginationParams);
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