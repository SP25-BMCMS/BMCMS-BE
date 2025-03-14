import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { BuildingDetailService } from './buildingDetail.service'
import { catchError, NotFoundError } from 'rxjs';
import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto';
import { CreateBuildingDetailDto } from '@app/contracts/BuildingDetails/create-buildingdetails.dto';
import { UpdateBuildingDetailDto } from '@app/contracts/BuildingDetails/update.buildingdetails';

@Controller('buildingdetails')
export class BuildingDetailController {
    constructor(private BuildingsService: BuildingDetailService) { }

   
  @Get()
  async getAllBuildings() {
    return await this.BuildingsService.getBuildingDetails();
  }

  @Get(':id')
  async getBuildingById(@Param('id') id: string) {
    return this.BuildingsService.getBuildingDetailById(id);
  }

  @Post()
  async createBuilding(@Body() createBuildingDto: CreateBuildingDetailDto) {
    return (await this.BuildingsService.createBuildingDetail(createBuildingDto))

  }

  @Put(':id')
  async updateBuilding(@Param('id') id: string, @Body() updateBuildingDto: UpdateBuildingDetailDto) {
    return this.BuildingsService.updateBuildingDetail({ ...updateBuildingDto, buildingId: id });
  }

  @Delete(':id')
  async deleteBuilding(@Param('id') id: string) {
    return this.BuildingsService.deleteBuildingDetail(id);
  }
}