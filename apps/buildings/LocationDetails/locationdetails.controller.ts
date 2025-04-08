import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException, EventPattern } from '@nestjs/microservices';
import { LocationDetailService } from './locationdetails.service';
import { UUID } from 'crypto';
import { LOCATIONDETAIL_PATTERN } from 'libs/contracts/src/LocationDetails/Locationdetails.patterns';
import { CreateLocationDetailDto } from 'libs/contracts/src/LocationDetails/create-locationdetails.dto';
import { UpdateLocationDetailDto } from 'libs/contracts/src/LocationDetails/update.locationdetails';
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Controller('locationdetails')
export class LocationDetailsController {
  constructor(private readonly locationDetailService: LocationDetailService) { }

  @MessagePattern(LOCATIONDETAIL_PATTERN.GET)
  async getAllLocationDetail(@Payload() paginationParams: PaginationParams) {
    return await this.locationDetailService.getAllLocationDetails(
      paginationParams,
    );
  }

  // Create a new LocationDetail (MessagePattern - for direct requests)
  @MessagePattern(LOCATIONDETAIL_PATTERN.CREATE)
  async createLocationDetail(
    @Payload() locationDetailDto: CreateLocationDetailDto,
  ) {
    return await this.locationDetailService.createLocationDetail(
      locationDetailDto,
    );
  }

  // Create a new LocationDetail (EventPattern - for event-based communication)
  @EventPattern(LOCATIONDETAIL_PATTERN.CREATE)
  async handleLocationDetailCreation(
    @Payload() locationDetailDto: CreateLocationDetailDto,
  ) {
    try {
      console.log('Received event to create LocationDetail:', JSON.stringify(locationDetailDto, null, 2));

      // Validate required fields to avoid errors
      if (!locationDetailDto.inspection_id) {
        console.error('Missing required field: inspection_id');
        return;
      }

      // Create the LocationDetail
      const result = await this.locationDetailService.createLocationDetail(
        locationDetailDto,
      );
      console.log('LocationDetail created via event:', result);
    } catch (error) {
      console.error('Failed to create LocationDetail via event:', error);
    }
  }

  // Create multiple LocationDetails (EventPattern)
  @EventPattern(LOCATIONDETAIL_PATTERN.CREATE_MANY)
  async handleMultipleLocationDetailCreation(
    @Payload() locationDetailDtos: CreateLocationDetailDto[],
  ) {
    try {
      console.log(`Received request to create ${locationDetailDtos.length} location details`);

      // Process each location detail
      for (const dto of locationDetailDtos) {
        try {
          const result = await this.locationDetailService.createLocationDetail(dto);
          console.log('LocationDetail created in batch:', result);
        } catch (detailError) {
          console.error('Failed to create one LocationDetail in batch:', detailError);
          // Continue with next item
        }
      }
    } catch (error) {
      console.error('Failed to process multiple LocationDetails via event:', error);
    }
  }

  // Update LocationDetail
  @MessagePattern(LOCATIONDETAIL_PATTERN.UPDATE)
  async updateLocationDetail(
    @Payload()
    payload: {
      locationDetailId: string;
      updateLocationDetailDto: UpdateLocationDetailDto;
    },
  ) {
    return await this.locationDetailService.updateLocationDetail(
      payload.locationDetailId,
      payload.updateLocationDetailDto,
    );
  }

  // Get LocationDetail by ID
  @MessagePattern(LOCATIONDETAIL_PATTERN.GET_BY_ID)
  async getLocationDetailById(
    @Payload() payload: { locationDetailId: string },
  ) {
    return await this.locationDetailService.getLocationDetailById(
      payload.locationDetailId,
    );
  }

  // Delete LocationDetail by ID
  @MessagePattern(LOCATIONDETAIL_PATTERN.DELETE)
  async deleteLocationDetail(@Payload() locationDetailId: string) {
    return await this.locationDetailService.deleteLocationDetail(
      locationDetailId,
    );
  }
}
