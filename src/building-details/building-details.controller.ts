import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BuildingDetailsService } from './building-details.service';
import { CreateBuildingDetailDto } from './dto/create-building-detail.dto';
import { UpdateBuildingDetailDto } from './dto/update-building-detail.dto';

@Controller('building-details')
export class BuildingDetailsController {
  constructor(private readonly buildingDetailsService: BuildingDetailsService) {}

  @Post()
  create(@Body() createBuildingDetailDto: CreateBuildingDetailDto) {
    return this.buildingDetailsService.create(createBuildingDetailDto);
  }

  @Get()
  findAll() {
    return this.buildingDetailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buildingDetailsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBuildingDetailDto: UpdateBuildingDetailDto) {
    return this.buildingDetailsService.update(+id, updateBuildingDetailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.buildingDetailsService.remove(+id);
  }
}
