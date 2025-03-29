import { Module } from '@nestjs/common';
import { JwtConfigModule } from 'apps/configs/jwt-config.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpModule } from '../otp/otp.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [UsersModule, JwtConfigModule, OtpModule],
})
export class AuthModule {}
