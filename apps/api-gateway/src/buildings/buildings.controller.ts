import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { BuildingsService } from './Buildings.service'
import { catchError, NotFoundError } from 'rxjs';
import { CreateBuildingDetailDto } from '@app/contracts/BuildingDetails/create-buildingdetails.dto';
import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto';
import { UpdateBuildingDto } from '@app/contracts/buildings/update-buildings.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@Controller('building')
@ApiTags('buildings')
export class BuildingsController {
  constructor(private BuildingsService: BuildingsService) { }

  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // login(@Body() data: { username: string, password: string }) {
  //     return this.UsersService.login(data.username, data.password)
  // }

  @Get()
  @ApiOperation({ summary: 'Get all buildings' })
  @ApiResponse({ status: 200, description: 'Returns all buildings' })
  async getAllBuildings() {
    return await this.BuildingsService.getBuildings();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get building by ID' })
  @ApiParam({ name: 'id', description: 'Building ID' })
  @ApiResponse({ status: 200, description: 'Building found' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  async getBuildingById(@Param('id') id: string) {
    return this.BuildingsService.getBuildingById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new building' })
  @ApiBody({ type: CreateBuildingDto })
  @ApiResponse({ status: 201, description: 'Building created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBuilding(@Body() createBuildingDto: CreateBuildingDto) {
    return (await this.BuildingsService.createBuilding(createBuildingDto))
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a building' })
  @ApiParam({ name: 'id', description: 'Building ID' })
  @ApiBody({ type: UpdateBuildingDto })
  @ApiResponse({ status: 200, description: 'Building updated successfully' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateBuilding(@Param('id') id: string, @Body() updateBuildingDto: UpdateBuildingDto) {
    return this.BuildingsService.updateBuilding({ ...updateBuildingDto, buildingId: id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a building' })
  @ApiParam({ name: 'id', description: 'Building ID' })
  @ApiResponse({ status: 200, description: 'Building deleted successfully' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  async deleteBuilding(@Param('id') id: string) {
    return this.BuildingsService.deleteBuilding(id);
  }
}