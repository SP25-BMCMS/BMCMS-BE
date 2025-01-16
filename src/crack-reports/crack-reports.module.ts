import { Module } from '@nestjs/common';
import { CrackReportsService } from './crack-reports.service';
import { CrackReportsController } from './crack-reports.controller';

@Module({
  controllers: [CrackReportsController],
  providers: [CrackReportsService],
})
export class CrackReportsModule {}
