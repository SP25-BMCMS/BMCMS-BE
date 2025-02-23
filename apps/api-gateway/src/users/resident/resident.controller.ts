import { Controller, Get, UseGuards } from "@nestjs/common"
import { ResidentService } from "./resident.service"
import { PassportJwtAuthGuard } from "../../guards/passport-jwt-guard"
import { RolesGuard } from "../../guards/role.guard"
import { Role } from "@prisma/client"
import { Roles } from "../../decorator/roles.decarator"

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