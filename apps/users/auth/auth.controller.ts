import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto';


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
    async signup(data: createUserDto) {
        return this.authService.signup(data)
    }

    @GrpcMethod('UserService', 'GetUserInfo')
    getUserInfo(data: { userId: string; username: string }) {
        return this.authService.getUserInfo(data.userId)
    }

    @GrpcMethod('UserService', 'GetAllUsers')
    async getAllUsers() {
        const users = await this.usersService.getAllUsers()
        return { users }
    }

    @GrpcMethod('UserService', 'Logout')
    async logout() {
        return { message: 'Logged out successfully' }
    }

    @GrpcMethod('UserService', 'ValidateUser')
    async validateUser(data: { username: string; password: string }) {
        return await this.authService.validateUser(data)
    }

    @GrpcMethod('UserService', 'Test')
    async test(data: { data: string }) {
        return { success: true }
    }


}
