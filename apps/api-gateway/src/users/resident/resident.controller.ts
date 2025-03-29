import { Controller, Get, Param, UseGuards, HttpStatus, HttpCode, NotFoundException } from '@nestjs/common';
import { ResidentService } from './resident.service';

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
