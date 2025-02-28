import { Controller, Get, UseGuards } from "@nestjs/common"
import { ResidentService } from "./resident.service"

@Controller('resident')
export class ResidentController {
    constructor(private residentService: ResidentService) { }

    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    @Get('all-residents')
    // @Roles(Role.Admin)
    getAllResidents() {
        return this.residentService.getAllResidents()
    }

    
}