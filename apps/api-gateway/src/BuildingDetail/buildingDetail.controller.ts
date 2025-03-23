import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { BuildingDetailService } from './buildingDetail.service'
import { catchError, NotFoundError } from 'rxjs';
import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto';
import { CreateBuildingDetailDto } from '@app/contracts/BuildingDetails/create-buildingdetails.dto';
import { UpdateBuildingDetailDto } from '@app/contracts/BuildingDetails/update.buildingdetails';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@Controller('buildingdetails')
@ApiTags('building-details')
export class BuildingDetailController {
  constructor(private BuildingsService: BuildingDetailService) { }


  @Get()
  @ApiOperation({ summary: 'Get all building details' })
  @ApiResponse({ status: 200, description: 'Returns all building details' })
  async getAllBuildings() {
    return await this.BuildingsService.getBuildingDetails();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get building detail by ID' })
  @ApiParam({ name: 'id', description: 'Building detail ID' })
  @ApiResponse({ status: 200, description: 'Building detail found' })
  @ApiResponse({ status: 404, description: 'Building detail not found' })
  async getBuildingById(@Param('id') id: string) {
    return this.BuildingsService.getBuildingDetailById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new building detail' })
  @ApiBody({ type: CreateBuildingDetailDto })
  @ApiResponse({ status: 201, description: 'Building detail created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBuilding(@Body() createBuildingDto: CreateBuildingDetailDto) {
    return (await this.BuildingsService.createBuildingDetail(createBuildingDto))

  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a building detail' })
  @ApiParam({ name: 'id', description: 'Building detail ID' })
  @ApiBody({ type: UpdateBuildingDetailDto })
  @ApiResponse({ status: 200, description: 'Building detail updated successfully' })
  @ApiResponse({ status: 404, description: 'Building detail not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateBuilding(@Param('id') id: string, @Body() updateBuildingDto: UpdateBuildingDetailDto) {
    return this.BuildingsService.updateBuildingDetail({ ...updateBuildingDto, buildingId: id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a building detail' })
  @ApiParam({ name: 'id', description: 'Building detail ID' })
  @ApiResponse({ status: 200, description: 'Building detail deleted successfully' })
  @ApiResponse({ status: 404, description: 'Building detail not found' })
  async deleteBuilding(@Param('id') id: string) {
    return this.BuildingsService.deleteBuildingDetail(id);
  }
}