import { Module } from '@nestjs/common'
import { AuthController } from '../auth/auth.controller'
import { AuthModule } from '../auth/auth.module'
import { AuthService } from '../auth/auth.service'
import { PrismaModule } from '../prisma/prisma.module'
import { UsersModule } from '../users/users.module'

@Module({
    imports: [UsersModule, AuthModule, PrismaModule],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AppModule {

}
