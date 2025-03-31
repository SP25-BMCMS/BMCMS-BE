import { Controller, Get, Param, UseGuards, HttpStatus, HttpCode, NotFoundException, Query } from '@nestjs/common';
import { ResidentService } from './resident.service';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Resident')
@Controller('resident')
export class ResidentController {
    constructor(private residentService: ResidentService) { }

    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    @Get('all-residents')
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    // @Roles(Role.Admin)
    async getAllResidents(
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        // Parse string query parameters to numbers and ensure they are valid
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? parseInt(limit, 10) : 10;
        
        console.log('Raw API Query Parameters - page:', page, 'limit:', limit);
        console.log('Parsed API Query Parameters - page:', parsedPage, 'limit:', parsedLimit);
        
        // Ensure we always pass valid numbers
        const response = await this.residentService.getAllResidents({ 
            page: parsedPage || 1, 
            limit: parsedLimit || 10 
        });
        
        console.log('Response pagination:', response.pagination);
        return response;
    }

    @Get(':residentId/apartments')
    @HttpCode(HttpStatus.OK)
    async getApartmentsByResidentId(@Param('residentId') residentId: string) {
        const response = await this.residentService.getApartmentsByResidentId(residentId);
        if (!response.isSuccess) {
            throw new NotFoundException(response.message);
        }
        return response;
    }

    @Get(':residentId/apartments/:apartmentId')
    @HttpCode(HttpStatus.OK)
    async getApartmentByResidentAndApartmentId(
        @Param('residentId') residentId: string,
        @Param('apartmentId') apartmentId: string,
    ) {
        const response = await this.residentService.getApartmentByResidentAndApartmentId(
            residentId,
            apartmentId,
        );
        if (!response.isSuccess) {
            throw new NotFoundException(response.message);
        }
        return response;
    }
}
