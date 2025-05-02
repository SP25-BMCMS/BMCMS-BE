import { Controller, Inject } from '@nestjs/common'
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  RpcException,
} from '@nestjs/microservices'
import { $Enums } from '@prisma/client-cracks'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto'
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto'
import { CrackReportsService } from './crack-reports.service'

@Controller()
export class CrackReportsController {
  constructor(
    private readonly crackReportsService: CrackReportsService,
    @Inject('TASK_SERVICE') private readonly taskClient: ClientProxy,
  ) { }

  @MessagePattern({ cmd: 'get-all-crack-report' })
  async getAllCrackReports(
    @Payload()
    data: {
      page?: number
      limit?: number
      search?: string
      severityFilter?: $Enums.Severity
    },
  ) {
    const { page = 1, limit = 10, search = '', severityFilter } = data
    return await this.crackReportsService.getAllCrackReports(
      page,
      limit,
      search,
      severityFilter,
    )
  }

  @MessagePattern({ cmd: 'get-crack-report-by-id' })
  async getCrackReportById(@Payload() crackId: string) {
    return await this.crackReportsService.findById(crackId)
  }

  @MessagePattern({ cmd: 'create-crack-report' })
  async createCrackReport(
    @Payload() payload: { dto: AddCrackReportDto; userId: string },
    @Ctx() context: RmqContext,
  ) {
    console.log('📩 Payload nhận được:', payload) // ✅ Debug xem có userId không
    const { dto, userId } = payload

    if (!userId) {
      throw new RpcException(
        new ApiResponse(false, 'Lỗi: Không tìm thấy userId trong token'),
      )
    }

    return await this.crackReportsService.addCrackReport(dto, userId)
  }

  @MessagePattern({ cmd: 'update-crack-report' })
  async updateCrackReport(
    @Payload() data: { crackId: string; dto: UpdateCrackReportDto },
  ) {
    return await this.crackReportsService.updateCrackReport(
      data.crackId,
      data.dto,
    )
  }

  @MessagePattern({ cmd: 'delete-crack-report' })
  async deleteCrackReport(@Payload() crackId: string) {
    return await this.crackReportsService.deleteCrackReport(crackId)
  }

  @MessagePattern({ cmd: 'get-buildingDetail-by-task-id' })
  async getBuildingDetailByTaskId(@Payload() payload: { taskId: string }) {
    return await this.crackReportsService.getBuildingDetailByTaskId(payload.taskId)
  }

  @MessagePattern({ cmd: 'update-crack-report-status' })
  async updateCrackReportStatus(
    @Payload() payload: { crackReportId: string; managerId: string; staffId: string },
  ) {
    return await this.crackReportsService.updateCrackReportStatus(
      payload.crackReportId,
      payload.managerId,
      payload.staffId,
    )
  }

  @MessagePattern('crack-reports.test-users-connection')
  async testUsersConnection() {
    return this.crackReportsService.testUsersServiceConnection()
  }

  @MessagePattern({ cmd: 'get-all-crack-report-by-user-id' })
  async getAllCrackReportByUserId(@Payload() payload: { userId: string }) {
    console.log("🚀 Kha ne ~ userId:", payload.userId)
    return await this.crackReportsService.getAllCrackReportByUserId(payload.userId)
  }

  @MessagePattern({ cmd: 'update-crack-report-for-all-status' })
  async updateCrackReportForAllStatus(
    @Payload() payload: { crackReportId: string; dto: UpdateCrackReportDto },
  ) {
    return await this.crackReportsService.updateCrackReportForAllStatus(
      payload.crackReportId,
      payload.dto,
    )
  }

  @MessagePattern({ cmd: 'get-crack-reports-by-manager-id' })
  async getCrackReportsByManagerId(
    @Payload() payload: {
      userId: string,
      page?: number,
      limit?: number,
      search?: string,
      severityFilter?: $Enums.Severity
    }
  ) {
    console.log("🚀 Kha ne ~ payload:", payload)
    return await this.crackReportsService.getCrackReportsByManagerId(
      payload.userId,
      payload.page,
      payload.limit,
      payload.search,
      payload.severityFilter
    )
  }
}