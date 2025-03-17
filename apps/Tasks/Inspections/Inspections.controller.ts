import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { TaskService } from '../Task/Task.service';
import { TASKS_PATTERN } from '../../../libs/contracts/src/tasks/task.patterns';
import { INSPECTIONS_PATTERN } from '../../../libs/contracts/src/inspections/inspection.patterns';
import { InspectionsService } from './Inspections.service';
import { UpdateCrackReportDto } from '../../../libs/contracts/src/cracks/update-crack-report.dto';
import { UpdateInspectionDto } from '../../../libs/contracts/src/inspections/update-inspection.dto';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionService: InspectionsService) { }

  @MessagePattern(INSPECTIONS_PATTERN.GET_BY_ID_Task_Assignment)
  async GetInspectionByTaskAssignmentId(
    @Payload() payload: { task_assignment_id: string },
  ) {
    return this.inspectionService.GetInspectionByTaskAssignmentId(
      payload.task_assignment_id,
    );
  }

  @MessagePattern(INSPECTIONS_PATTERN.UPDATE)
  async updateInspection(@Payload() data: { inspection_id: string; dto: UpdateInspectionDto }) {
    return await this.inspectionService.updateInspection(data.inspection_id, data.dto);
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
    return this.inspectionService.GetAllInspections();
  }
}
