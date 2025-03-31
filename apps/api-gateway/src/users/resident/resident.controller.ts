import { Controller, Get, Param, UseGuards, HttpStatus, HttpCode, NotFoundException } from '@nestjs/common';
import { ResidentService } from './resident.service';
import { lastValueFrom } from 'rxjs';

@Controller('resident')
export class ResidentController {
    constructor(private residentService: ResidentService) { }

    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    @Get('all-residents')
    // @Roles(Role.Admin)
    getAllResidents() {
        return this.residentService.getAllResidents();
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
