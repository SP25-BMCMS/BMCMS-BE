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
} 