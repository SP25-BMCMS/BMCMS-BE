import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { createUserDto } from '@app/contracts/users/create-user.dto'
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
        
        if (!user) {
            console.error("🚀 Sending RpcException: 404 - invalid username and password");

            throw new RpcException({status: 404, message: 'invalid username and password'})
        }
        return this.signIn(user)
    }

    async validateUser(input: AuthInput) {
        const user = await this.usersService.getUserByUsername(input.username)
        console.log("🚀 ~ AuthService ~ validateUser ~ user:", user)
        
        if (!user)  
            throw new RpcException({status: 404, message: 'invalid1 username and password'})

            


        const isPasswordValid = await bcrypt.compare(input.password, user.password)
        console.log("🚀 ~ AuthService ~ validateUser ~ isPasswordValid:", isPasswordValid)
       
        if (!isPasswordValid)
            
            throw new RpcException({status: 404, message: 'invalid2 username and password'})

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

    async signup(data: createUserDto) {
        return this.usersService.createUser(data)
    }

    async getUserInfo(userId: string) {
        return this.usersService.getUserById(userId)
    }
}
