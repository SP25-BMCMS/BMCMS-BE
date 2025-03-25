import { Controller, Post, Body } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';
import { CreateWorkingPositionDto } from '../../../libs/contracts/src/users/create-working-position.dto';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';
import { ApiOperation, ApiBody } from '@nestjs/swagger';


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
        return await this.authService.signup(data);
    }

    @GrpcMethod('UserService', 'VerifyOtpAndCompleteSignup')
    async verifyOtpAndCompleteSignup(data: { phone: string; otp: string; userData: createUserDto }) {
        return await this.authService.verifyOtpAndCompleteSignup(data);
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

    @GrpcMethod('UserService', 'GetApartmentsByResidentId')
    async getApartmentsByResidentId(data: { residentId: string }) {
        return await this.usersService.getApartmentsByResidentId(data.residentId);
    }

    @GrpcMethod('UserService', 'ResidentLogin')
    async residentLogin(data: { phone: string; password: string }) {
        return await this.authService.residentLogin(data);
    }

    @GrpcMethod('UserService', 'UpdateResidentApartments')
    async updateResidentApartments(data: { residentId: string; apartments: { apartmentName: string; buildingId: string }[] }) {
        return await this.usersService.updateResidentApartments(data.residentId, data.apartments);
    }

    @GrpcMethod('UserService', 'UpdateAccountStatus')
    async updateAccountStatus(data: { userId: string; accountStatus: string }) {
        return await this.usersService.updateAccountStatus(data.userId, data.accountStatus);
    }
}
