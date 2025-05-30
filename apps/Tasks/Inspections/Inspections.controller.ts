import { Body, Controller, Param, Post, Get, Put, Delete } from '@nestjs/common'
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices'
import { TaskService } from '../Task/Task.service'
import { TASKS_PATTERN } from '../../../libs/contracts/src/tasks/task.patterns'
import { INSPECTIONS_PATTERN } from '../../../libs/contracts/src/inspections/inspection.patterns'
import { InspectionsService } from './Inspections.service'
import { UpdateCrackReportDto } from '../../../libs/contracts/src/cracks/update-crack-report.dto'
import { UpdateInspectionDto } from '../../../libs/contracts/src/inspections/update-inspection.dto'
import { ApiOperation, ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger'
import { CreateInspectionDto } from '@app/contracts/inspections/create-inspection.dto'
import { ApiResponse as ApiResponseDto } from '@app/contracts/ApiResponse/api-response'
import { Inspection } from '@prisma/client-Task'
import { ChangeInspectionStatusDto } from '@app/contracts/inspections/change-inspection-status.dto'
import { AddImageToInspectionDto } from '@app/contracts/inspections/add-image.dto'
import { UpdateInspectionPrivateAssetDto } from '@app/contracts/inspections/update-inspection-privateasset.dto'
import { UpdateInspectionReportStatusDto } from '@app/contracts/inspections/update-inspection-report-status.dto'

@Controller('inspections')
@ApiTags('inspections')
export class InspectionsController {
  constructor(private readonly inspectionService: InspectionsService) { }

  @MessagePattern(INSPECTIONS_PATTERN.GET_BY_ID_Task_Assignment)
  async GetInspectionByTaskAssignmentId(
    @Payload() payload: { task_assignment_id: string },
  ) {
    return this.inspectionService.GetInspectionByTaskAssignmentId(
      payload.task_assignment_id,
    )
  }

  @MessagePattern(INSPECTIONS_PATTERN.UPDATE)
  async updateInspection(
    @Payload() data: { inspection_id: string; dto: UpdateInspectionDto },
  ) {
    return await this.inspectionService.updateInspection(
      data.inspection_id,
      data.dto,
    )
  }

  // @MessagePattern(INSPECTIONS_PATTERN.GET_BY_CRACK_ID)
  // async GetInspectionByCrackId(
  //   @Payload() payload: { crack_id: string },
  // ) {
  //   return this.inspectionService.GetInspectionByCrackId(
  //     payload.crack_id,
  //   );
  // }

  @MessagePattern(INSPECTIONS_PATTERN.GET)
  async GetAllInspections() {
    return this.inspectionService.GetAllInspections()
  }

  @Post()
  @ApiOperation({ summary: 'Create a new inspection' })
  @ApiBody({ type: CreateInspectionDto })
  @ApiResponse({ status: 201, description: 'Inspection created successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @MessagePattern(INSPECTIONS_PATTERN.CREATE)
  async createInspection(@Payload() dto: CreateInspectionDto): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.createInspection(dto)
  }


  @Post()
  @ApiOperation({ summary: 'Create a new inspection' })
  @ApiBody({ type: CreateInspectionDto })
  @ApiResponse({ status: 201, description: 'Inspection created successfully', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @MessagePattern(INSPECTIONS_PATTERN.CREATE_ACTUAL_COST)
  async createInspectionActualCost(@Payload() dto: CreateInspectionDto): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.createInspectionActualCost(dto)
  }
  // @MessagePattern(INSPECTIONS_PATTERN.CHANGE_STATUS)
  // async changeStatus(@Payload() dto: ChangeInspectionStatusDto): Promise<ApiResponseDto<Inspection>> {
  //   return this.inspectionService.changeStatus(dto);
  // }

  @MessagePattern(INSPECTIONS_PATTERN.ADD_IMAGE)
  async addImage(@Payload() dto: AddImageToInspectionDto): Promise<ApiResponseDto<Inspection>> {
    return this.inspectionService.addImage(dto)
  }

  @MessagePattern(INSPECTIONS_PATTERN.GET_DETAILS)
  async getInspectionDetails(@Payload() inspection_id: string): Promise<ApiResponseDto<any>> {
    return this.inspectionService.getInspectionDetails(inspection_id)
  }

  @MessagePattern(INSPECTIONS_PATTERN.GET_BY_ID)
  async getInspectionById(@Payload() payload: { inspection_id: string }) {
    return this.inspectionService.getInspectionById(payload.inspection_id)
  }

  @MessagePattern({ cmd: 'get-building-detail-id-from-task-assignment' })
  async getBuildingDetailIdFromTaskAssignment(@Payload() payload: { task_assignment_id: string }) {
    return this.inspectionService.getBuildingDetailIdFromTaskAssignment(payload.task_assignment_id)
  }

  @MessagePattern(INSPECTIONS_PATTERN.UPDATE_PRIVATE_ASSET)
  async updatePrivateAsset(
    @Payload() data: { inspection_id: string; dto: UpdateInspectionPrivateAssetDto },
  ) {
    return await this.inspectionService.updateInspectionPrivateAsset(
      data.inspection_id,
      data.dto,
    )
  }

  @MessagePattern(INSPECTIONS_PATTERN.UPDATE_REPORT_STATUS)
  async updateReportStatus(
    @Payload() data: { inspection_id: string; dto: UpdateInspectionReportStatusDto },
  ) {
    return await this.inspectionService.updateInspectionReportStatus(
      data.inspection_id,
      data.dto,
    )
  }

  @MessagePattern(INSPECTIONS_PATTERN.UPDATE_REPORT_STATUS_BY_MANAGER)
  async updateInspectionReportStatusByManager(
    @Payload() data: UpdateInspectionReportStatusDto
  ) {
    console.log(data)
    return await this.inspectionService.updateInspectionReportStatusByManager(
      data.inspection_id,
      data.report_status,
      data.userId,
      data.reason
    );
  }

  @MessagePattern(INSPECTIONS_PATTERN.GET_TASK_ASSIGNMENT_DETAILS)
  async getTaskAssignmentDetails(@Payload() payload: { task_assignment_id: string }) {
    return this.inspectionService.getTaskAssignmentDetails(payload.task_assignment_id);
  }

  @MessagePattern(INSPECTIONS_PATTERN.GET_INSPECTION_PDF)
  async getInspectionPdfByTaskAssignment(@Payload() payload: { task_assignment_id: string }) {
    return this.inspectionService.getInspectionPdfByTaskAssignment(payload.task_assignment_id);
  }

  @MessagePattern(INSPECTIONS_PATTERN.GET_BUILDING_AREA_FROM_SCHEDULE)
  async getBuildingAreaFromSchedule(@Payload() payload: { schedule_job_id: string }) {
    return this.inspectionService.getBuildingAreaFromSchedule(payload.schedule_job_id);
  }

  @MessagePattern({ cmd: 'verify-leader-and-area' })
  async verifyLeaderAndArea(@Payload() payload: { employee_id: string, task_id: string }) {
    return this.inspectionService.verifyLeaderAndArea(payload.employee_id, payload.task_id);
  }
}
