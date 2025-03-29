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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AreasService } from './Areas.service';
import { catchError, NotFoundError } from 'rxjs';
import { CreateAreaDto } from '@app/contracts/Areas/create-areas.dto';
import { UpdateAreaDto } from '@app/contracts/Areas/update.areas';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';

@Controller('areas')
@ApiTags('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new area' })
  @ApiBody({ type: CreateAreaDto })
  @ApiResponse({ status: 201, description: 'Area created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createArea(@Body() createAreaDto: CreateAreaDto) {
    return await this.areasService.createArea(createAreaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all areas with pagination' })
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
  async getAllAreas(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.areasService.getAllAreas({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
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
  async updateArea(
    @Param('id') id: string,
    @Body() updateAreaDto: UpdateAreaDto,
  ) {
    return await this.areasService.updateArea(id, updateAreaDto);
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
