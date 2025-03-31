import { Controller, Get, Param, UseGuards, HttpStatus, HttpCode, NotFoundException, Query } from '@nestjs/common';
import { ResidentService } from './resident.service';
<<<<<<< HEAD
import { lastValueFrom } from 'rxjs';
=======
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
>>>>>>> 7d0b8bacdc8d9f20638d277cf9efc90136fb1959

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
        try {
            console.log(`API Gateway Controller - Getting apartments for resident ID: ${residentId}`);
            const response = await lastValueFrom(this.residentService.getApartmentsByResidentId(residentId));

            console.log(`API Gateway Controller - Response: success=${response.success || response.isSuccess}, data length=${response.data?.length || 0}`);

            if (!response.success && !response.isSuccess) {
                throw new NotFoundException(response.message || 'No apartments found');
            }

            return response;
        } catch (error) {
            console.error(`API Gateway Controller - Error: ${error.message}`);
            throw error;
        }
    }

    @Get(':residentId/apartments/:apartmentId')
    @HttpCode(HttpStatus.OK)
    async getApartmentByResidentAndApartmentId(
        @Param('residentId') residentId: string,
        @Param('apartmentId') apartmentId: string,
    ) {
        try {
            console.log(`API Gateway Controller - Getting apartment for resident ${residentId} and apartment ${apartmentId}`);
            const response = await lastValueFrom(this.residentService.getApartmentByResidentAndApartmentId(
                residentId,
                apartmentId,
            ));

            console.log(`API Gateway Controller - Response: success=${response.success || response.isSuccess}, hasData=${!!response.data}`);

            if (!response.success && !response.isSuccess) {
                throw new NotFoundException(response.message || 'Apartment not found');
            }

            return response;
        } catch (error) {
            console.error(`API Gateway Controller - Error: ${error.message}`);
            throw error;
        }
    }
}
