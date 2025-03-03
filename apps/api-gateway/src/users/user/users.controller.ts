import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client-users'
import { Roles } from '../../decorator/roles.decarator'
import { PassportJwtAuthGuard } from '../../guards/passport-jwt-guard'
import { PassportLocalGuard } from '../../guards/passport-local-guard'
import { UsersService } from './users.service'
import { createUserDto } from 'libs/contracts/src/users/create-user.dto'
import { RolesGuard } from '../../guards/role.guard'
import { ApiResponse } from '../../../../../libs/contracts/src/ApiReponse/api-response';

@Controller('auth')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(PassportLocalGuard)
    @Post('login')
    login(@Body() data: { username: string, password: string }) {
        return this.usersService.login(data)
    }

    @UseGuards(PassportJwtAuthGuard)
    @Get("me")
    getUserInfo(@Req() req) {
        return this.usersService.getUserInfo(req.user)
    }

    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    // @Roles(Role.Admin)
    @Post('signup')
    async signup(@Body() userData: createUserDto, @Res() res: any): Promise<Response> {
        const response = await this.usersService.signup(userData);

        if (!response.isSuccess) {
            return res.status(HttpStatus.BAD_REQUEST).json(response); // 🔴 400 Bad Request khi thất bại
        }

        return res.status(HttpStatus.CREATED).json(response); // ✅ 201 Created khi thành công
    }

    @UseGuards(PassportJwtAuthGuard)
    @Post('logout')
    logout() {
        return this.usersService.logout()
    }

    @UseGuards(PassportJwtAuthGuard, RolesGuard)
    @Get('all-users')
    @Roles(Role.Admin)
    getAllUsers() {
        return this.usersService.getAllUsers()
    }

    @Get()
    test(@Body() data: { username: string, password: string }) {
        return this.usersService.test(data)
    }

}
