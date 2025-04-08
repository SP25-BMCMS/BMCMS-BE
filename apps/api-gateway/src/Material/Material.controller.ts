import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
    Delete
} from '@nestjs/common'
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiParam,
    ApiQuery
} from '@nestjs/swagger'
import { CreateMaterialDto } from '@app/contracts/materials/create-material.dto'
import { UpdateMaterialDto } from '@app/contracts/materials/update-material.dto'
import { UpdateMaterialStatusDto } from '@app/contracts/materials/update-material-status.dto'
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
import { MaterialService } from './Material.service'
import { MaterialStatus } from '@prisma/client-Task'
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto'
import { ApiResponse as ApiResponseDto } from '@app/contracts/ApiResponse/api-response'
import { Inspection } from '@prisma/client-Task'

@Controller('materials')
@ApiTags('materials')
export class MaterialController {
    constructor(private readonly materialService: MaterialService) { }

    @Get()
    @ApiOperation({ summary: 'Get all materials with pagination' })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number (default: 1)'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Items per page (default: 10)'
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'Search by name or description'
    })

    @ApiQuery({
        name: 'statusFilter',
        required: false,
        type: String,
        description: 'Filter by task status',
        enum: MaterialStatus,
    })
    @ApiResponse({ status: 200, description: 'Returns all materials' })
    async getAllMaterials(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('statusFilter') statusFilter?: MaterialStatus,

    ) {
        const paginationParams: PaginationParams = {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
            search: search || undefined,
            statusFilter
        }
        return this.materialService.getAllMaterials(paginationParams)
    }

    @Get(':material_id')
    @ApiOperation({ summary: 'Get material by ID' })
    @ApiParam({ name: 'material_id', description: 'Material ID' })
    @ApiResponse({ status: 200, description: 'Returns the material' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async getMaterialById(@Param('material_id') material_id: string) {
        return this.materialService.getMaterialById(material_id)
    }

    @Post()
    @ApiOperation({ summary: 'Create a new material' })
    @ApiBody({ type: CreateMaterialDto })
    @ApiResponse({ status: 201, description: 'Material created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createMaterial(@Body() createMaterialDto: CreateMaterialDto) {
        return this.materialService.createMaterial(createMaterialDto)
    }

    @Put(':material_id')
    @ApiOperation({ summary: 'Update material' })
    @ApiParam({ name: 'material_id', description: 'Material ID' })
    @ApiBody({ type: UpdateMaterialDto })
    @ApiResponse({ status: 200, description: 'Material updated successfully' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async updateMaterial(
        @Param('material_id') material_id: string,
        @Body() updateMaterialDto: UpdateMaterialDto
    ) {
        return this.materialService.updateMaterial(material_id, updateMaterialDto)
    }

    @Put(':material_id/unit-price')
    @ApiOperation({ summary: 'Update material unit price' })
    @ApiParam({ name: 'material_id', description: 'Material ID' })
    @ApiBody({ schema: { type: 'object', properties: { unit_price: { type: 'number' } } } })
    @ApiResponse({ status: 200, description: 'Unit price updated successfully' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async updateUnitPrice(
        @Param('material_id') material_id: string,
        @Body('unit_price') unit_price: number
    ) {
        return this.materialService.updateUnitPrice(material_id, unit_price)
    }

    @Put(':material_id/stock-quantity')
    @ApiOperation({ summary: 'Update material stock quantity' })
    @ApiParam({ name: 'material_id', description: 'Material ID' })
    @ApiBody({ schema: { type: 'object', properties: { stock_quantity: { type: 'number' } } } })
    @ApiResponse({ status: 200, description: 'Stock quantity updated successfully' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async updateStockQuantity(
        @Param('material_id') material_id: string,
        @Body('stock_quantity') stock_quantity: number
    ) {
        return this.materialService.updateStockQuantity(material_id, stock_quantity)
    }

    @Put(':material_id/status')
    @ApiOperation({ summary: 'Update material status' })
    @ApiParam({ name: 'material_id', description: 'Material ID' })
    @ApiBody({ type: UpdateMaterialStatusDto })
    @ApiResponse({ status: 200, description: 'Status updated successfully' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async updateStatus(
        @Param('material_id') material_id: string,
        @Body() updateMaterialStatusDto: UpdateMaterialStatusDto
    ) {
        return this.materialService.updateStatus(material_id, updateMaterialStatusDto)
    }

    // @Post(':inspection_id/materials')
    // @ApiOperation({ summary: 'Add materials to inspection' })
    // @ApiParam({ name: 'inspection_id', description: 'ID of the inspection' })
    // @ApiResponse({ status: 200, description: 'Materials added successfully', type: ApiResponseDto })
    // @ApiResponse({ status: 400, description: 'Bad request' })
    // async addMaterialsToInspection(
    //     @Param('inspection_id') inspection_id: string,
    //     @Body() materials: CreateRepairMaterialDto[]
    // ): Promise<ApiResponseDto<Inspection>> {
    //     return this.materialService.addMaterialsToInspection(inspection_id, materials);
    // }
} 