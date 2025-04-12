import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from 'libs/contracts/src/contracts/create-contract.dto';
import { UpdateContractDto } from 'libs/contracts/src/contracts/update-contract.dto';
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard';
import { ContractQueryDto } from '@app/contracts/contracts/contract-query.dto';

@ApiTags('Contracts')
@Controller('contracts')
@ApiBearerAuth()
// @UseGuards(PassportJwtAuthGuard)
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new contract' })
    async createContract(@Body() createContractDto: CreateContractDto) {
        return this.contractsService.createContract(createContractDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all contracts with pagination, filtering, and sorting' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter vendor name' })
    async getAllContracts(@Query() queryDto: ContractQueryDto) {
        return this.contractsService.getAllContracts(queryDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a contract by ID' })
    async getContractById(@Param('id') contractId: string) {
        return this.contractsService.getContractById(contractId);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a contract' })
    async updateContract(
        @Param('id') contractId: string,
        @Body() updateContractDto: UpdateContractDto,
    ) {
        return this.contractsService.updateContract(contractId, updateContractDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a contract' })
    async deleteContract(@Param('id') contractId: string) {
        return this.contractsService.deleteContract(contractId);
    }
}
