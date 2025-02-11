import { createUserDto } from '@app/contracts/users/create-user.dto'
import { USERS_PATTERN } from '@app/contracts/users/users.patterns'
import { Controller, HttpStatus, Logger, UseFilters } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { RpcException } from '@nestjs/microservices';
//@UseFilters(new RpcToHttpExceptionFilter()) // Áp dụng cho tất cả API trong AuthController

@Controller()

export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService
    ) { }

    @MessagePattern(USERS_PATTERN.LOGIN)
    async login(data: { username: string; password: string }) {
        console.log(`🚀 [Microservice] Received login request:`, data);
        try {
            return await this.authService.authenticate(data);

        } catch (error) {
        const rpcError = error.getError(); 

        console.log("🚀 ~ Extracted error object:", rpcError);
       throw new RpcException({ statusCode: rpcError.status|| 503  , message:rpcError.message|| "lỗi gì đó khác"})
        
        }    }

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
