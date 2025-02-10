import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { PassportJwtAuthGuard } from './guards/passport-jwt-guard'
import { PassportLocalGuard } from './guards/passport-local-guard'
import { UsersService } from './users.service'
import { createUserDto } from '@app/contracts/users/create-user.dto'

@Controller('auth')
export class UsersController {
    constructor(private UsersService: UsersService) { }

    @HttpCode(HttpStatus.OK)
    @UseGuards(PassportLocalGuard)
    @Post('login')
    login(@Body() data: { username: string, password: string }) {
        return this.UsersService.login(data.username, data.password)
    }

    @UseGuards(PassportJwtAuthGuard)
    @Get("me")
    getUserInfo(@Req() req) {
        return this.UsersService.getUserInfo(req.user)
    }

    // @UseGuards(PassportJwtAuthGuard)
    @Post('signup')
    signup(@Body() data: createUserDto) {
        return this.UsersService.signup(data)
    }

    @Get('all-users')
    getAllUsers() {
        return this.UsersService.getAllUsers()
    }
    
    @Get()
    test() {
        return this.UsersService.test({})
    }
}
