import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { catchError, firstValueFrom, NotFoundError } from 'rxjs';
import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';
import { RepairMaterialService } from './RepairMaterial.service';
import { ApiResponse as ApiResponseDto } from '@app/contracts/ApiReponse/api-response';
import { Inspection } from '@prisma/client-Task';
import { AddMaterialsToInspectionDto } from '@app/contracts/repairmaterials/Add-Materials-Inspection';

@Controller('repair-materials')
@ApiTags('repair-materials')
export class RepairMaterialController {
  constructor(private readonly repairMaterialService: RepairMaterialService) {}

  @Post()
  @ApiOperation({ summary: 'Create repair material' })
  @ApiBody({ type: CreateRepairMaterialDto })
  @ApiResponse({
    status: 201,
    description: 'Repair material created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createRepairMaterial(
    @Body() createRepairMaterialDto: CreateRepairMaterialDto,
  ) {
    return this.repairMaterialService.createRepairMaterial(
      createRepairMaterialDto,
    );
  }

  @Post(':inspection_id/materials')
  @ApiOperation({ summary: 'Add materials to inspection' })
  @ApiParam({ name: 'inspection_id', description: 'ID of the inspection' })
  @ApiBody({ type: [AddMaterialsToInspectionDto] })
  @ApiResponse({ status: 200, description: 'Materials added successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addMaterialsToInspection(
    @Param('inspection_id') inspection_id: string,
    @Body() materials: AddMaterialsToInspectionDto[]
  ): Promise<ApiResponseDto<Inspection>> {
    return this.repairMaterialService.addMaterialsToInspection(inspection_id, materials);
  }

  //   @Put(':material_id')
  //   @ApiOperation({ summary: 'Update a repair material' })
  //   @ApiParam({ name: 'material_id', description: 'Repair Material ID' })
  //   @ApiBody({ type: UpdateRepairMaterialDto })
  //   @ApiResponse({ status: 200, description: 'Repair material updated successfully' })
  //   @ApiResponse({ status: 404, description: 'Repair material not found' })
  //   @ApiResponse({ status: 400, description: 'Bad request' })
  //   async updateRepairMaterial(
  //     @Param('material_id') material_id: string,
  //     @Body() updateRepairMaterialDto: UpdateRepairMaterialDto,
  //   ) {
  //     return this.repairMaterialService.updateRepairMaterial(material_id, updateRepairMaterialDto);
  //   }

  //   @Get(':material_id')
  //   @ApiOperation({ summary: 'Get repair material by ID' })
  //   @ApiParam({ name: 'material_id', description: 'Repair Material ID' })
  //   @ApiResponse({ status: 200, description: 'Repair material found' })
  //   @ApiResponse({ status: 404, description: 'Repair material not found' })
  //   async getRepairMaterialById(@Param('material_id') material_id: string) {
  //     return this.repairMaterialService.getRepairMaterialById(material_id);
  //   }

  //   @Delete(':material_id')
  //   @ApiOperation({ summary: 'Delete a repair material' })
  //   @ApiParam({ name: 'material_id', description: 'Repair Material ID' })
  //   @ApiResponse({ status: 200, description: 'Repair material deleted successfully' })
  //   @ApiResponse({ status: 404, description: 'Repair material not found' })
  //   async deleteRepairMaterial(@Param('material_id') material_id: string) {
  //     return this.repairMaterialService.deleteRepairMaterial(material_id);
  //   }

  //   @Get()
  //   @ApiOperation({ summary: 'Get all repair materials' })
  //   @ApiResponse({ status: 200, description: 'Returns all repair materials' })
  //   @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)' })
  //   @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  //   async getAllRepairMaterials(
  //     @Query('page') page?: number,
  //     @Query('limit') limit?: number
  //   ) {
  //     try {
  //       // Create pagination params object
  //       const paginationParams: PaginationParams = {
  //         page: page ? parseInt(page.toString()) : 1,
  //         limit: limit ? parseInt(limit.toString()) : 10
  //       };

  //       return this.repairMaterialService.getAllRepairMaterials(paginationParams);
  //     } catch (error) {
  //       console.error('Error in getAllRepairMaterials controller:', error);
  //       throw new Error(`Failed to get repair materials: ${error.message}`);
  //     }
  //   }
}



























  //   @Put(':material_id')
  //   @ApiOperation({ summary: 'Update a repair material' })
  //   @ApiParam({ name: 'material_id', description: 'Repair Material ID' })
  //   @ApiBody({ type: UpdateRepairMaterialDto })
  //   @ApiResponse({ status: 200, description: 'Repair material updated successfully' })
  //   @ApiResponse({ status: 404, description: 'Repair material not found' })
  //   @ApiResponse({ status: 400, description: 'Bad request' })
  //   async updateRepairMaterial(
  //     @Param('material_id') material_id: string,
  //     @Body() updateRepairMaterialDto: UpdateRepairMaterialDto,
  //   ) {
  //     return this.repairMaterialService.updateRepairMaterial(material_id, updateRepairMaterialDto);
  //   }

  //   @Get(':material_id')
  //   @ApiOperation({ summary: 'Get repair material by ID' })
  //   @ApiParam({ name: 'material_id', description: 'Repair Material ID' })
  //   @ApiResponse({ status: 200, description: 'Repair material found' })
  //   @ApiResponse({ status: 404, description: 'Repair material not found' })
  //   async getRepairMaterialById(@Param('material_id') material_id: string) {
  //     return this.repairMaterialService.getRepairMaterialById(material_id);
  //   }

  //   @Delete(':material_id')
  //   @ApiOperation({ summary: 'Delete a repair material' })
  //   @ApiParam({ name: 'material_id', description: 'Repair Material ID' })
  //   @ApiResponse({ status: 200, description: 'Repair material deleted successfully' })
  //   @ApiResponse({ status: 404, description: 'Repair material not found' })
  //   async deleteRepairMaterial(@Param('material_id') material_id: string) {
  //     return this.repairMaterialService.deleteRepairMaterial(material_id);
  //   }

  //   @Get()
  //   @ApiOperation({ summary: 'Get all repair materials' })
  //   @ApiResponse({ status: 200, description: 'Returns all repair materials' })
  //   @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)' })
  //   @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  //   async getAllRepairMaterials(
  //     @Query('page') page?: number,
  //     @Query('limit') limit?: number
  //   ) {
  //     try {
  //       // Create pagination params object
  //       const paginationParams: PaginationParams = {
  //         page: page ? parseInt(page.toString()) : 1,
  //         limit: limit ? parseInt(limit.toString()) : 10
  //       };

  //       return this.repairMaterialService.getAllRepairMaterials(paginationParams);
  //     } catch (error) {
  //       console.error('Error in getAllRepairMaterials controller:', error);
  //       throw new Error(`Failed to get repair materials: ${error.message}`);
  //     }
  //   }
