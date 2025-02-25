import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { Roles } from '../../decorator/roles.decarator'
import { PassportJwtAuthGuard } from '../../guards/passport-jwt-guard'
import { PassportLocalGuard } from '../../guards/passport-local-guard'
import { UsersService } from './users.service'
import { createUserDto } from 'libs/contracts/src/users/create-user.dto'
import { RolesGuard } from '../../guards/role.guard'
import { ApiResponse } from '../../../../../libs/contracts/src/ApiReponse/api-response';

@Controller('auth')
export class UsersController {
    constructor(private UsersService: UsersService) { }

    @UseGuards(PassportLocalGuard)
    @Post('login')
    login(@Body() data: { username: string, password: string }) {
        return this.UsersService.login(data)
    }

    @UseGuards(PassportJwtAuthGuard)
    @Get("me")
    getUserInfo(@Req() req) {
        return this.UsersService.getUserInfo(req.user)
    }

    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    // @Roles(Role.Admin)
    @Post('signup')
    async signup(@Body() data: createUserDto): Promise<ApiResponse<any>> {
        const result = await this.UsersService.signup(data);

        console.log('🚀 Kết quả từ API Gateway:', result);

        return result;
    }

    @UseGuards(PassportJwtAuthGuard)
    @Post('logout')
    logout() {
        return this.UsersService.logout()
    }

    @UseGuards(PassportJwtAuthGuard, RolesGuard)
    @Get('all-users')
    @Roles(Role.Admin)
    getAllUsers() {
        return this.UsersService.getAllUsers()
    }

    @Get()
    test(@Body() data: { username: string, password: string }) {
        return this.UsersService.test(data)
    }

}
