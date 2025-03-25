import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards, Query } from '@nestjs/common'
import { LocationDetailService } from './locationDetail.service'
import { catchError, NotFoundError } from 'rxjs';
import { CreateLocationDetailDto } from 'libs/contracts/src/LocationDetails/create-locationdetails.dto';
import { UpdateLocationDetailDto } from 'libs/contracts/src/LocationDetails/update.locationdetails';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@Controller('locationdetails')
@ApiTags('location-details')
export class LocationDetailController {
  constructor(private readonly locationDetailService: LocationDetailService) { }

  @Get()
  @ApiOperation({ summary: 'Get all location details with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page' })
  async getAllBuildings(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return await this.locationDetailService.getLocationDetails({
      page: Number(page) || 1,
      limit: Number(limit) || 10
    });
  }

  // Create a new LocationDetail
  @Post()
  @ApiOperation({ summary: 'Create a new location detail' })
  @ApiBody({ type: CreateLocationDetailDto })
  @ApiResponse({ status: 201, description: 'Location detail created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createLocationDetail(@Body() createLocationDetailDto: CreateLocationDetailDto) {
    return await this.locationDetailService.createLocationDetail(createLocationDetailDto);
  }

  // Get LocationDetail by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get location detail by ID' })
  @ApiParam({ name: 'id', description: 'Location detail ID' })
  @ApiResponse({ status: 200, description: 'Location detail found' })
  @ApiResponse({ status: 404, description: 'Location detail not found' })
  async getLocationDetailById(@Param('id') id: string) {
    return await this.locationDetailService.getLocationDetailById(id);
  }

  // Update LocationDetail
  @Put(':id')
  @ApiOperation({ summary: 'Update a location detail' })
  @ApiParam({ name: 'id', description: 'Location detail ID' })
  @ApiBody({ type: UpdateLocationDetailDto })
  @ApiResponse({ status: 200, description: 'Location detail updated successfully' })
  @ApiResponse({ status: 404, description: 'Location detail not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateLocationDetail(
    @Param('id') id: string,
    @Body() updateLocationDetailDto: UpdateLocationDetailDto,
  ) {
    return await this.locationDetailService.updateLocationDetail(updateLocationDetailDto);
  }

  // Delete LocationDetail
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a location detail' })
  @ApiParam({ name: 'id', description: 'Location detail ID' })
  @ApiResponse({ status: 200, description: 'Location detail deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location detail not found' })
  async deleteLocationDetail(@Param('id') id: string) {
    return await this.locationDetailService.deleteLocationDetail(id);
  }
}