import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { RpcException } from '@nestjs/microservices'
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';
import { CreateWorkingPositionDto } from '../../../libs/contracts/src/users/create-working-position.dto';
import { PositionName } from '@prisma/client-users';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';

type AuthInput = { username: string; password: string }
type SignInData = { userId: string; username: string, role: string }
type AuthResult = { accessToken: string; refreshToken: string; userId: string; username: string }

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async authenticate(input: AuthInput): Promise<AuthResult> {
        const user = await this.validateUser(input)
        return this.signIn(user)
    }

    async validateUser(input: AuthInput) {
        const user = await this.usersService.getUserByUsername(input.username)
        const isPasswordValid = await bcrypt.compare(input.password, user.password)

        if (!isPasswordValid)
            throw new RpcException({ statusCode: 401, message: 'invalid credentials!' })

        // Check if account is inactive
        if (user.accountStatus === 'Inactive')
            throw new RpcException({ statusCode: 403, message: 'Account is inactive. Please contact admin for activation.' })

        return { userId: user.userId, username: user.username, role: user.role }
    }

    async validateResidentByPhone(phone: string, password: string) {
        try {
            const user = await this.usersService.getUserByPhone(phone);

            // Check if user is a Resident
            if (user.role !== 'Resident') {
                throw new RpcException({
                    statusCode: 401,
                    message: 'Sai số điện thoại hoặc mật khẩu'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new RpcException({
                    statusCode: 401,
                    message: 'Sai số điện thoại hoặc mật khẩu'
                });
            }

            // Check if account is inactive
            if (user.accountStatus === 'Inactive') {
                throw new RpcException({
                    statusCode: 401,
                    message: 'Tài khoản chưa được kích hoạt, vui lòng liên hệ ban quản lý để được kích hoạt'
                });
            }

            return {
                userId: user.userId,
                username: user.username,
                role: user.role
            };
        } catch (error) {
            // Re-throw RpcExceptions, but wrap other errors
            if (error instanceof RpcException) throw error;

            throw new RpcException({
                statusCode: 401,
                message: 'Sai số điện thoại hoặc mật khẩu'
            });
        }
    }

    async signIn(user: SignInData): Promise<AuthResult> {
        const tokenPayload = { sub: user.userId, username: user.username, role: user.role }
        const accessToken = await this.jwtService.signAsync(tokenPayload, { expiresIn: '1h' })
        const refreshToken = await this.jwtService.signAsync(tokenPayload, { expiresIn: '1d' })

        return {
            accessToken,
            refreshToken,
            userId: user.userId,
            username: user.username,
        }
    }

    async refreshToken(token: string): Promise<AuthResult> {
        if (!token) throw new UnauthorizedException('Refresh token is required')

        try {
            const decoded = this.jwtService.verify(token)
            const user = { userId: decoded.sub, username: decoded.username, role: decoded.role }
            return this.signIn(user)
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token')
        }
    }

    async logout(): Promise<{ message: string }> {
        return { message: 'Logged out successfully' }
    }

    async signup(data: createUserDto): Promise<ApiResponse<any>> {
        return await this.usersService.signup(data);
    }

    async getUserInfo(userId: string) {
        return this.usersService.getUserById(userId)
    }

    // Working Position Methods
    async createWorkingPosition(data: CreateWorkingPositionDto) {
        return this.usersService.createWorkingPosition(data);
    }

    async getAllWorkingPositions() {
        return this.usersService.getAllWorkingPositions();
    }

    async getWorkingPositionById(data: { positionId: string }) {
        return this.usersService.getWorkingPositionById(data);
    }

    async deleteWorkingPosition(data: { positionId: string }) {
        return this.usersService.deleteWorkingPosition(data);
    }

    // Department Methods
    async createDepartment(data: CreateDepartmentDto) {
        return this.usersService.createDepartment(data);
    }

    async residentLogin(data: { phone: string; password: string }): Promise<AuthResult> {
        const user = await this.validateResidentByPhone(data.phone, data.password);
        return this.signIn(user);
    }
}
