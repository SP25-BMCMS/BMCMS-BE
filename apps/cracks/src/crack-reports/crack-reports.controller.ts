import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CrackReportsService } from './crack-reports.service';
import { CrackReportDto } from 'libs/contracts/src/cracks/crack-report.dto';
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';

@Controller()
export class CrackReportsController {
  constructor(private readonly crackReportsService: CrackReportsService) {}

  @MessagePattern({ cmd: 'get-all-crack-report' })
  async getAllCrackReports() {
    return await this.crackReportsService.getAllCrackReports();
  }

  // @MessagePattern({ cmd: 'get-crack-report-by-id' })
  // async getCrackReportById(@Payload() crackId: string) {
  //   return await this.crackReportsService.findById(crackId);
  // }

  @MessagePattern({ cmd: 'create-crack-report' })
  async createCrackReport(@Payload() payload: { dto: AddCrackReportDto; userId: string }, @Ctx() context: RmqContext) {
    const { dto, userId } = payload;
    return await this.crackReportsService.addCrackReport(dto, userId);
  }

  // @MessagePattern({ cmd: 'update-crack-report' })
  // async updateCrackReport(@Payload() data: { crackId: string; dto: UpdateCrackReportDto }) {
  //   return await this.crackReportsService.updateCrackReport(data.crackId, data.dto);
  // }
  //
  // @MessagePattern({ cmd: 'delete-crack-report' })
  // async deleteCrackReport(@Payload() crackId: string) {
  //   return await this.crackReportsService.deleteCrackReport(crackId);
  // }

}
