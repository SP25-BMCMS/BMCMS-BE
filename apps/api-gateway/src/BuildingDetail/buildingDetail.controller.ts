import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { BuildingDetailService } from './buildingDetail.service'
import { catchError, NotFoundError } from 'rxjs';

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
  async createBuilding(@Body() createBuildingDto: any) {
    return (await this.BuildingsService.createBuildingDetail(createBuildingDto))

  }

  @Put(':id')
  async updateBuilding(@Param('id') id: string, @Body() updateBuildingDto: any) {
    return this.BuildingsService.updateBuildingDetail({ ...updateBuildingDto, buildingId: id });
  }

  @Delete(':id')
  async deleteBuilding(@Param('id') id: string) {
    return this.BuildingsService.deleteBuildingDetail(id);
  }
}