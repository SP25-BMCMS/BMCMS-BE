import { Module } from '@nestjs/common';
import { CrackRecordService } from './CrackRecord.service';
import { CrackRecordController } from './CrackRecord.controller';
import { PrismaModule } from 'apps/buildings/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  controllers: [CrackRecordController],
  providers: [CrackRecordService],
  exports: [CrackRecordService],
})
export class CrackRecordModule {} 