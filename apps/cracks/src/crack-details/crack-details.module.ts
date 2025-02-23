import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module'; // Import PrismaModule
import { PrismaService } from '../../prisma/prisma.service';
import { CrackDetailsController } from './crack-details.controller';
import { CrackDetailsService } from './crack-details.service'; // Import PrismaService

@Module({
  imports: [PrismaModule],
  controllers: [CrackDetailsController],
  providers: [CrackDetailsService, PrismaService],
})
export class CrackDetailsModule {}
