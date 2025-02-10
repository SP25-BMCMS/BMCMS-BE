import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { JWT_SECRET } from 'apps/configs/jwt-secret'

@Global()
@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: JWT_SECRET,
            signOptions: {
                expiresIn: '1d',
            },
        }),
    ],
    exports: [JwtModule],
})
export class JwtConfigModule { }
