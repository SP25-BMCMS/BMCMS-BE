import { Controller, Get, Param, UseGuards, HttpStatus, HttpCode, NotFoundException, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ResidentService } from './resident.service';
import { lastValueFrom } from 'rxjs';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/role.guard';
import { Roles } from '../../decorator/roles.decarator';

@ApiTags('Resident')
@Controller('resident')
export class ResidentController {
    constructor(private residentService: ResidentService) { }

    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    @Get('all-residents')
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo username, email hoặc phone' })
    // @Roles(Role.Admin)
    async getAllResidents(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('search') search?: string,
    ) {
        const result = await this.residentService.getAllResidents({ page, limit, search });

        return {
            success: result.success || true,
            message: result.message || 'Danh sách cư dân',
            data: result.data || [],
            pagination: result.pagination || {
                total: 0,
                page: page,
                limit: limit,
                totalPages: 0
            }
        };
    }

    @Get(':residentId/apartments')
    @HttpCode(HttpStatus.OK)
    async getApartmentsByResidentId(@Param('residentId') residentId: string) {
        try {
            console.log(`API Gateway Controller - Getting apartments for resident ID: ${residentId}`);
            const response = await lastValueFrom(this.residentService.getApartmentsByResidentId(residentId));

            console.log(`API Gateway Controller - Response received: success=${response.success || response.isSuccess}, data length=${response.data?.length || 0}`);

            if (response.data?.length > 0) {
                const firstApartment = response.data[0];
                console.log(`First apartment in response: ${JSON.stringify({
                    apartmentId: firstApartment.apartmentId,
                    name: firstApartment.apartmentName,
                    hasBuildingDetails: !!firstApartment.buildingDetails
                })}`);
            }

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

            if (response.data) {
                console.log(`Apartment data: id=${response.data.apartmentId}, name=${response.data.apartmentName}, warrantyDate=${response.data.warrantyDate || 'none'}, hasBuildingDetails=${!!response.data.buildingDetails}`);
            }

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
