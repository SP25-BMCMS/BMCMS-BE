import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrackReportDto } from 'libs/contracts/src/cracks/crack-report.dto';

@Injectable()
export class CrackReportsService {
  constructor(private prismService: PrismaService) {}

  async getAllCrackReports() {
    return this.prismService.crackReport.findMany();
  }

  async addCrackReport(crackReportDto: CrackReportDto) {
    return this.prismService.crackReport.create({
      data: {
        buildingDetailId: crackReportDto.buildingDetailId,
        photoUrl: crackReportDto.photoUrl,
        status: crackReportDto.status,
        reportedBy: crackReportDto.reportedBy,
      },
    });
  }
}
