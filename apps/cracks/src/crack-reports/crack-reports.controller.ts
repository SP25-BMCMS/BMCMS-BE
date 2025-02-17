import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CrackReportsService } from './crack-reports.service';
import { CrackReportDto } from 'libs/contracts/src/cracks/crack-report.dto';

@Controller()
export class CrackReportsController {
  constructor(private readonly crackReportsService: CrackReportsService) {}

  @MessagePattern({ cmd: 'get-all-crack-report' })
  async getAllCrackReports() {
    return await this.crackReportsService.getAllCrackReports();
  }

  @MessagePattern({ cmd: 'create-crack-report' })
  async createCrackReport(@Payload() crackReportDto: CrackReportDto) {
    return this.crackReportsService.addCrackReport(crackReportDto);
  }
}
