import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CrackRecordService } from './CrackRecord.service';
import { CreateCrackRecordDto } from '@app/contracts/CrackRecord/create-CrackRecord.dto';
import { UpdateCrackRecordDto } from '@app/contracts/CrackRecord/update-CrackRecord.dto';
import { CrackRecordDto } from '@app/contracts/CrackRecord/CrackRecord.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';

@ApiTags('Crack Records')
@Controller('crack-records')
export class CrackRecordController {
  constructor(private readonly crackRecordService: CrackRecordService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new crack record' })
  @SwaggerResponse({ type: CrackRecordDto })
  async create(@Body() createDto: CreateCrackRecordDto): Promise<ApiResponse<CrackRecordDto>> {
    return await this.crackRecordService.create(createDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all crack records with pagination' })
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
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for crack record',
  })
  @Get()
  @ApiOperation({ summary: 'Get all crack records' })
  @SwaggerResponse({ type: [CrackRecordDto] })
  async findAll(  
    @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('search') search?: string,): Promise<ApiResponse<CrackRecordDto[]>> {
    return await this.crackRecordService.findAll();
  }

  @Get('location/:locationId')
  @ApiOperation({ summary: 'Get crack records by location' })
  @SwaggerResponse({ type: [CrackRecordDto] })
  async findByLocation(@Param('locationId') locationId: string): Promise<ApiResponse<CrackRecordDto[]>> {
    return await this.crackRecordService.findByLocation(locationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a crack record by ID' })
  @SwaggerResponse({ type: CrackRecordDto })
  async findOne(@Param('id') id: string): Promise<ApiResponse<CrackRecordDto>> {
    return await this.crackRecordService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a crack record' })
  @SwaggerResponse({ type: CrackRecordDto })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCrackRecordDto,
  ): Promise<ApiResponse<CrackRecordDto>> {
    return await this.crackRecordService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a crack record' })
  @SwaggerResponse({ type: CrackRecordDto })
  async remove(@Param('id') id: string): Promise<ApiResponse<CrackRecordDto>> {
    return await this.crackRecordService.remove(id);
  }
} 