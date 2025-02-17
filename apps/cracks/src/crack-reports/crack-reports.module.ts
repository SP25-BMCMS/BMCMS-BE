import { Module } from '@nestjs/common';
import { CrackReportsService } from './crack-reports.service';
import { CrackReportsController } from './crack-reports.controller';
import { PrismaModule } from '../../prisma/prisma.module'; // Import PrismaModule
import { PrismaService } from '../../prisma/prisma.service'; // Import PrismaService

@Module({
  imports: [PrismaModule],
  controllers: [CrackReportsController],
  providers: [CrackReportsService, PrismaService],
})
export class CrackReportsModule {}
