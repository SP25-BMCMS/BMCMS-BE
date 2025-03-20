import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { AreasService } from './Areas.service'
import { catchError, NotFoundError } from 'rxjs';
import { CreateAreaDto } from '@app/contracts/Areas/create-areas.dto';
import { UpdateAreaDto } from '@app/contracts/Areas/update.areas';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@Controller('areas')
@ApiTags('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new area' })
  @ApiBody({ type: CreateAreaDto })
  @ApiResponse({ status: 201, description: 'Area created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createArea(@Body() createAreaDto: CreateAreaDto) {
    return await this.areasService.createArea(createAreaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all areas' })
  @ApiResponse({ status: 200, description: 'Returns all areas' })
  async getAllAreas() {
    console.log("🚀 ~ AreasCsdssontroller ~ getAllAreas ~ getAllAreas:")

    return await this.areasService.getAreas();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get area by ID' })
  @ApiParam({ name: 'id', description: 'Area ID' })
  @ApiResponse({ status: 200, description: 'Area found' })
  @ApiResponse({ status: 404, description: 'Area not found' })
  async getAreaById(@Param('id') id: string) {
    return await this.areasService.getAreaById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an area' })
  @ApiParam({ name: 'id', description: 'Area ID' })
  @ApiBody({ type: UpdateAreaDto })
  @ApiResponse({ status: 200, description: 'Area updated successfully' })
  @ApiResponse({ status: 404, description: 'Area not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateArea(@Param('id') id: string, @Body() updateAreaDto: UpdateAreaDto) {
    return await this.areasService.updateArea({ ...updateAreaDto, areaId: id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an area' })
  @ApiParam({ name: 'id', description: 'Area ID' })
  @ApiResponse({ status: 200, description: 'Area deleted successfully' })
  @ApiResponse({ status: 404, description: 'Area not found' })
  async deleteArea(@Param('id') id: string) {
    return await this.areasService.deleteArea(id);
  }
}