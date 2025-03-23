import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { LocationDetailService} from './locationdetails.service';
import { UUID } from 'crypto';
import { LOCATIONDETAIL_PATTERN } from 'libs/contracts/src/LocationDetails/Locationdetails.patterns';
import { CreateLocationDetailDto } from 'libs/contracts/src/LocationDetails/create-locationdetails.dto';
import { UpdateLocationDetailDto } from 'libs/contracts/src/LocationDetails/update.locationdetails';

@Controller('locationdetails')
export class LocationDetailsController {

  constructor(private readonly locationDetailService: LocationDetailService) {}

  @MessagePattern(LOCATIONDETAIL_PATTERN.GET)
  async getAllLocationDetail() {
    return await this.locationDetailService.getAllLocationDetails();
  }


  // Create a new LocationDetail
  @MessagePattern(LOCATIONDETAIL_PATTERN.CREATE)
  async createLocationDetail(@Payload() locationDetailDto: CreateLocationDetailDto) {
    return await this.locationDetailService.createLocationDetail(locationDetailDto);
  }

  // Update LocationDetail
  @MessagePattern(LOCATIONDETAIL_PATTERN.UPDATE)
  async updateLocationDetail(
    @Payload() payload: { 
      locationDetailId: string, 
      updateLocationDetailDto: UpdateLocationDetailDto 
    }  ) {
    return await this.locationDetailService.updateLocationDetail(payload.locationDetailId,payload.updateLocationDetailDto);
  }

  // Get LocationDetail by ID
  @MessagePattern(LOCATIONDETAIL_PATTERN.GET_BY_ID)
  async getLocationDetailById(@Payload() payload: { locationDetailId: string}) {
    return await this.locationDetailService.getLocationDetailById(payload.locationDetailId);
  }


  // Delete LocationDetail by ID
  @MessagePattern(LOCATIONDETAIL_PATTERN.DELETE)
  async deleteLocationDetail(@Payload() locationDetailId: string) {
    return await this.locationDetailService.deleteLocationDetail(locationDetailId);
  }
}