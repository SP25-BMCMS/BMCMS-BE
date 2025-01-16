import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LocationDetailsService } from './location-details.service';
import { CreateLocationDetailDto } from './dto/create-location-detail.dto';
import { UpdateLocationDetailDto } from './dto/update-location-detail.dto';

@Controller('location-details')
export class LocationDetailsController {
  constructor(private readonly locationDetailsService: LocationDetailsService) {}

  @Post()
  create(@Body() createLocationDetailDto: CreateLocationDetailDto) {
    return this.locationDetailsService.create(createLocationDetailDto);
  }

  @Get()
  findAll() {
    return this.locationDetailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationDetailsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLocationDetailDto: UpdateLocationDetailDto) {
    return this.locationDetailsService.update(+id, updateLocationDetailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationDetailsService.remove(+id);
  }
}
