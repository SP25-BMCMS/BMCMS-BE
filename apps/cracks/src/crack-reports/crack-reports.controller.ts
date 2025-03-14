import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext, RpcException } from '@nestjs/microservices';
import { CrackReportsService } from './crack-reports.service';
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { ApiResponse } from 'libs/contracts/src/ApiReponse/api-response';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Controller()
export class CrackReportsController {
  constructor(
    private readonly crackReportsService: CrackReportsService,
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy
  ) { }

  @MessagePattern({ cmd: 'get-all-crack-report' })
  async getAllCrackReports() {
    return await this.crackReportsService.getAllCrackReports();
  }

  @MessagePattern({ cmd: 'get-crack-report-by-id' })
  async getCrackReportById(@Payload() crackId: string) {
    return await this.crackReportsService.findById(crackId);
  }

  @MessagePattern({ cmd: 'create-crack-report' })
  async createCrackReport(
    @Payload() payload: { dto: AddCrackReportDto; userId: string },
    @Ctx() context: RmqContext
  ) {
    console.log('📩 Payload nhận được:', payload); // ✅ Debug xem có userId không
    const { dto, userId } = payload;

    if (!userId) {
      throw new RpcException(new ApiResponse(false, 'Lỗi: Không tìm thấy userId trong token'));
    }

    return await this.crackReportsService.addCrackReport(dto, userId);
  }


  @MessagePattern({ cmd: 'update-crack-report' })
  async updateCrackReport(@Payload() data: { crackId: string; dto: UpdateCrackReportDto }) {
    return await this.crackReportsService.updateCrackReport(data.crackId, data.dto);
  }

  @MessagePattern({ cmd: 'delete-crack-report' })
  async deleteCrackReport(@Payload() crackId: string) {
    return await this.crackReportsService.deleteCrackReport(crackId);
  }

  @MessagePattern({ cmd: 'update-crack-report-status' })
  async updateCrackReportStatus(
    @Payload() payload: { crackReportId: string; managerId: string }
  ) {
    return await this.crackReportsService.updateCrackReportStatus(
      payload.crackReportId,
      payload.managerId,
      this.taskClient
    );
  }
}
