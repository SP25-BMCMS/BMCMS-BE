import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { BuildingsService } from './Buildings.service'

@Controller('building')
export class BuildingsController {
    constructor(private BuildingsService: BuildingsService) { }

    // @HttpCode(HttpStatus.OK)
    // @Post('login')
    // login(@Body() data: { username: string, password: string }) {
    //     return this.UsersService.login(data.username, data.password)
    // }

    @Get('abc') 
    getBuilding() {
        console.log("🚀 ~ BuildingsController ~ getBuilding ~ GetBuilding:")

        return this.BuildingsService.GetBuilding()
    }

    // @Post('signup')
    // signup(@Body() data: createUserDto) {
    //     return this.UsersService.signup(data)
    // }

    // @Get('all-users')
    // getAllUsers() {
    //     return this.UsersService.getAllUsers()
    // }
    
    // @Get()
    // test() {
    //     return this.UsersService.test({})
    // }
}
