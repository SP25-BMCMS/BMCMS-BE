import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @GrpcMethod('UserService', 'GetAllStaff')
    async getAllStaff() {
        return this.usersService.getAllStaff();
    }

    @GrpcMethod('UserService', 'UpdateResidentApartments')
    async updateResidentApartments(data: { residentId: string; apartments: { apartmentName: string; buildingId: string }[] }) {
        return this.usersService.updateResidentApartments(data.residentId, data.apartments);
    }
} 