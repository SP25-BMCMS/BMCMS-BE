import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  Query,
  HttpException,
} from '@nestjs/common';
import { BuildingDetailService } from './buildingDetail.service';
import { catchError, NotFoundError } from 'rxjs';
import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto';
import { CreateBuildingDetailDto } from '@app/contracts/BuildingDetails/create-buildingdetails.dto';
import { UpdateBuildingDetailDto } from '@app/contracts/BuildingDetails/update.buildingdetails';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@Controller('buildingdetails')
@ApiTags('building-details')
export class BuildingDetailController {
  constructor(private BuildingsService: BuildingDetailService) { }

  @Get()
  @ApiOperation({ summary: 'Get all building details with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  async getAllBuildings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.BuildingsService.getBuildingDetails({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
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
  @ApiResponse({
    status: 201,
    description: 'Building detail created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBuilding(@Body() createBuildingDto: CreateBuildingDetailDto) {
    return await this.BuildingsService.createBuildingDetail(createBuildingDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a building detail' })
  @ApiParam({ name: 'id', description: 'Building detail ID' })
  @ApiBody({ type: UpdateBuildingDetailDto })
  @ApiResponse({
    status: 200,
    description: 'Building detail updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Building detail not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateBuilding(
    @Param('id') id: string,
    @Body() updateBuildingDto: UpdateBuildingDetailDto,
  ) {
    return this.BuildingsService.updateBuildingDetail({
      ...updateBuildingDto,
      buildingId: id,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a building detail and all related data' })
  @ApiParam({ name: 'id', description: 'Building detail ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Building detail and all related entities (location details, devices, technical records, maintenance histories, and crack records) deleted successfully'
  })
  @ApiResponse({ status: 404, description: 'Building detail not found' })
  @ApiResponse({ status: 500, description: 'Server error during deletion process' })
  @HttpCode(HttpStatus.OK)
  async deleteBuilding(@Param('id') id: string) {
    try {
      return await this.BuildingsService.deleteBuildingDetail(id);
    } catch (error) {
      throw new HttpException(
        `Error deleting building detail: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
