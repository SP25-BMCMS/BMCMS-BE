import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { LocationDetailService } from './locationDetail.service'
import { catchError, NotFoundError } from 'rxjs';
import { CreateLocationDetailDto } from '@app/contracts/LocationDetails/create-locationdetails.dto';
import { UpdateLocationDetailDto } from '@app/contracts/LocationDetails/update.locationdetails';
@Controller('locationdetails')
export class LocationDetailController {
  constructor(private readonly locationDetailService: LocationDetailService) {}
 
  @Get()
  async getAllBuildings() {
    return await this.locationDetailService.getLocationDetails  ();
  }

  // Create a new LocationDetail
  @Post()
  async createLocationDetail(@Body() createLocationDetailDto: CreateLocationDetailDto) {
    return await this.locationDetailService.createLocationDetail(createLocationDetailDto);
  }

  // Get LocationDetail by ID
  @Get(':id')
  async getLocationDetailById(@Param('id') id: string) {
    return await this.locationDetailService.getLocationDetailById(id);
  }

  // Update LocationDetail
  @Put(':id')
  async updateLocationDetail(
    @Param('id') id: string,
    @Body() updateLocationDetailDto: UpdateLocationDetailDto,
  ) {
    return await this.locationDetailService.updateLocationDetail( updateLocationDetailDto);
  }

  // Delete LocationDetail
  @Delete(':id')
  async deleteLocationDetail(@Param('id') id: string) {
    return await this.locationDetailService.deleteLocationDetail(id);
  }
}