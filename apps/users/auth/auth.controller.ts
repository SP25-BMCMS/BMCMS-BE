import { createUserDto } from '@app/contracts/users/create-user.dto'
import { USERS_PATTERN } from '@app/contracts/users/users.patterns'
import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'

@Controller()
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService
    ) { }

    @MessagePattern(USERS_PATTERN.LOGIN)
    async login(data: { username: string; password: string }) {
        return this.authService.authenticate(data)
    }

    @MessagePattern(USERS_PATTERN.ME)
    getUserInfo(@Payload() data) {
        return this.authService.getUserInfo(data)
    }

    @MessagePattern(USERS_PATTERN.SIGNUP)
    async signup(data: createUserDto) {
        return this.authService.signup(data)
    }

    @MessagePattern(USERS_PATTERN.ALL_USERS)
    async getAllUsers() {
        return this.usersService.getAllUsers()
    }

    @MessagePattern(USERS_PATTERN.TEST)
    async test(data: any) {
        return true
    }
}
