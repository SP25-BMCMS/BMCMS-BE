import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ResidentService } from './resident.service';

@Controller('resident')
export class ResidentController {
  constructor(private residentService: ResidentService) {}

  // @UseGuards(PassportJwtAuthGuard, RolesGuard)
  @Get('all-residents')
  // @Roles(Role.Admin)
  getAllResidents() {
    return this.residentService.getAllResidents();
  }

  @Get(':residentId/apartments')
  getApartmentsByResidentId(@Param('residentId') residentId: string) {
    return this.residentService.getApartmentsByResidentId(residentId);
  }

  @Get(':residentId/apartments/:apartmentId')
  getApartmentByResidentAndApartmentId(
    @Param('residentId') residentId: string,
    @Param('apartmentId') apartmentId: string,
  ) {
    return this.residentService.getApartmentByResidentAndApartmentId(
      residentId,
      apartmentId,
    );
  }
}
