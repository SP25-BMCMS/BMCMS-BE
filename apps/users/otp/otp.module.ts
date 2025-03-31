import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
