import { Module } from '@nestjs/common'
import { JwtConfigModule } from 'apps/configs/jwt-config.module'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [UsersModule, JwtConfigModule],
})
export class AuthModule { }
