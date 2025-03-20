import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Req, Res, UseGuards, Param, Put, Delete, Patch } from '@nestjs/common';
import { Role } from '@prisma/client-users'
import { Roles } from '../../decorator/roles.decarator'
import { PassportJwtAuthGuard } from '../../guards/passport-jwt-guard'
import { PassportLocalGuard } from '../../guards/passport-local-guard'
import { UsersService } from './users.service'
import { createUserDto } from 'libs/contracts/src/users/create-user.dto'
import { RolesGuard } from '../../guards/role.guard'
import { ApiResponse } from '../../../../../libs/contracts/src/ApiReponse/api-response';
import { LoginDto } from '@app/contracts/users/login.dto';
import { CreateWorkingPositionDto } from 'libs/contracts/src/users/create-working-position.dto';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';

@Controller('auth')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(PassportLocalGuard)
    @Post('login')
    // login(@Body() data: { username: string, password: string }) {
    //     return this.usersService.login(data)
    // }
    login(@Body() data: LoginDto) {
        return this.usersService.login(data);
    }

    @Post('resident/login')
    async residentLogin(@Body() data: { phone: string, password: string }, @Res() res: any) {
        try {
            const response = await this.usersService.residentLogin(data);
            return res.status(HttpStatus.OK).json(response);
        } catch (error) {
            // Get status code and message from error
            const status = error instanceof HttpException
                ? error.getStatus()
                : HttpStatus.UNAUTHORIZED;

            const message = error instanceof HttpException
                ? error.message
                : 'Đăng nhập không thành công';

            return res.status(status).json({
                statusCode: status,
                message: message
            });
        }
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

    // Working Position Methods
    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    // @Roles(Role.Admin)
    @Post('working-position')
    async createWorkingPosition(@Body() data: CreateWorkingPositionDto) {
        return this.usersService.createWorkingPosition(data);
    }

    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    // @Roles(Role.Admin)
    @Get('working-positions')
    async getAllWorkingPositions() {
        return this.usersService.getAllWorkingPositions();
    }

    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    // @Roles(Role.Admin)
    @Get('working-position/:positionId')
    async getWorkingPositionById(@Param('positionId') positionId: string) {
        return this.usersService.getWorkingPositionById(positionId);
    }

    // @UseGuards(PassportJwtAuthGuard, RolesGuard)
    // @Roles(Role.Admin)
    @Delete('working-position/:positionId')
    async deleteWorkingPosition(@Param('positionId') positionId: string) {
        return this.usersService.deleteWorkingPosition(positionId);
    }

    @Post('department')
    async createDepartment(@Body() data: CreateDepartmentDto, @Res() res: any) {
        const response = await this.usersService.createDepartment(data);

        if (!response.isSuccess) {
            return res.status(HttpStatus.NOT_FOUND).json(response);
        }

        return res.status(HttpStatus.CREATED).json(response);
    }

    @Get('apartments/:residentId')
    async getApartmentsByResidentId(@Param('residentId') residentId: string, @Res() res: any) {
        const response = await this.usersService.getApartmentsByResidentId(residentId);

        if (!response.isSuccess) {
            return res.status(HttpStatus.NOT_FOUND).json(response);
        }

        return res.status(HttpStatus.OK).json(response);
    }

    @UseGuards(PassportJwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @Patch('resident/:residentId/apartments')
    async updateResidentApartments(
        @Param('residentId') residentId: string,
        @Body() data: { apartments: { apartmentName: string; buildingId: string }[] },
        @Res() res: any
    ) {
        try {
            const response = await this.usersService.updateResidentApartments(residentId, data.apartments);
            return res.status(HttpStatus.OK).json(response);
        } catch (error) {
            const status = error instanceof HttpException
                ? error.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

            const message = error instanceof HttpException
                ? error.message
                : 'Lỗi khi cập nhật căn hộ';

            return res.status(status).json({
                statusCode: status,
                message: message
            });
        }
    }

}
