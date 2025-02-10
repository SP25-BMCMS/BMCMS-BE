import { Injectable, Inject, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ClientProxy } from '@nestjs/microservices'
import { Strategy } from 'passport-local'
import { USERS_CLIENT } from '../../constraints'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'my-local') {
    constructor(@Inject(USERS_CLIENT) private readonly usersClient: ClientProxy) {
        super({
            usernameField: 'username',
            passwordField: 'password',
        })
    }

    async validate(username: string, password: string): Promise<any> {
        const user = await this.usersClient.send({ cmd: 'validate_user' }, { username, password })

        if (!user) {
            throw new UnauthorizedException()
        }

        return user
    }
}
