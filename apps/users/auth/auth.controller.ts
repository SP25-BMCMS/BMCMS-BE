import { Controller, } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';
import { CreateWorkingPositionDto } from '../../../libs/contracts/src/users/create-working-position.dto';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';


@Controller()
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) { }

    @GrpcMethod('UserService', 'Login')
    async login(data: { username: string; password: string }) {
        return await this.authService.authenticate(data)

    }

    @GrpcMethod('UserService', 'Signup')
    async signup(data: createUserDto): Promise<ApiResponse<any>> {
        const response = await this.authService.signup(data);
        return response;
    }


    @GrpcMethod('UserService', 'GetUserInfo')
    async getUserInfo(data: { userId: string; username: string }) {
        return await this.authService.getUserInfo(data.userId)
    }

    @GrpcMethod('UserService', 'GetAllUsers')
    async getAllUsers() {
        const users = await this.usersService.getAllUsers()
        return users
    }

    @GrpcMethod('UserService', 'Logout')
    async logout() {
        return await this.authService.logout()
    }

    @GrpcMethod('UserService', 'ValidateUser')
    async validateUser(data: { username: string; password: string }) {
        return await this.authService.validateUser(data)
    }

    @GrpcMethod('UserService', 'Test')
    async test(data: { data: string }) {
        return { success: true }
    }

    @GrpcMethod('UserService', 'CreateWorkingPosition')
    async createWorkingPosition(data: CreateWorkingPositionDto) {
        return await this.usersService.createWorkingPosition(data);
    }

    @GrpcMethod('UserService', 'GetAllWorkingPositions')
    async getAllWorkingPositions() {
        return await this.usersService.getAllWorkingPositions();
    }

    @GrpcMethod('UserService', 'GetWorkingPositionById')
    async getWorkingPositionById(data: { positionId: string }) {
        return await this.usersService.getWorkingPositionById(data);
    }

    @GrpcMethod('UserService', 'DeleteWorkingPosition')
    async deleteWorkingPosition(data: { positionId: string }) {
        return await this.usersService.deleteWorkingPosition(data);
    }

    @GrpcMethod('UserService', 'CreateDepartment')
    async createDepartment(data: CreateDepartmentDto) {
        return await this.usersService.createDepartment(data);
    }
}
