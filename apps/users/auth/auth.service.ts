import { createUserDto } from '@app/contracts/users/create-user.dto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { RpcException } from '@nestjs/microservices'

type AuthInput = { username: string; password: string }
type SignInData = { userId: string; username: string }
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
        return { userId: user.userId, username: user.username }
    }

    async signIn(user: SignInData): Promise<AuthResult> {
        const tokenPayload = { sub: user.userId, username: user.username }
        const accessToken = await this.jwtService.signAsync(tokenPayload, { expiresIn: '1h' })
        const refreshToken = await this.jwtService.signAsync(tokenPayload, { expiresIn: '7d' })

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
            const user = { userId: decoded.sub, username: decoded.username }
            return this.signIn(user)
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token')
        }
    }

    async logout(): Promise<{ message: string }> {
        return { message: 'Logged out successfully' }
    }

    async signup(data: createUserDto) {
        return this.usersService.createUser(data)
    }

    async getUserInfo(userId: string) {
        return this.usersService.getUserById(userId)
    }
}
