import { Injectable, Inject, UnauthorizedException, OnModuleInit } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ClientGrpc } from '@nestjs/microservices'
import { Strategy } from 'passport-local'
import { USERS_CLIENT } from '../../constraints'
import { lastValueFrom } from 'rxjs'
import { UserInterface } from '../users.interface'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'my-local') implements OnModuleInit {
    private usersService: UserInterface

    constructor(@Inject(USERS_CLIENT) private readonly usersClient: ClientGrpc) {
        super({
            usernameField: 'username',
            passwordField: 'password',
        })
    }

    onModuleInit() {
        this.usersService = this.usersClient.getService<UserInterface>('UserService')
    }

    async validate(username: string, password: string): Promise<any> {
        try {
            // Gọi gRPC service
            const user = await lastValueFrom(await this.usersService.validateUser({ username, password }))

            if (!user) {
                throw new UnauthorizedException('Invalid username or password')
            }

            return user
        } catch (error) {
            throw new UnauthorizedException('Authentication failed')
        }
    }
}
