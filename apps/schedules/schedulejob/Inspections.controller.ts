import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { TaskService } from '../Task/Task.service';
import { TASKS_PATTERN } from '../../../libs/contracts/src/tasks/task.patterns';
import { INSPECTIONS_PATTERN } from '../../../libs/contracts/src/inspections/inspection.patterns';
import { InspectionsService } from './Inspections.service';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionService: InspectionsService) {}

  @MessagePattern(INSPECTIONS_PATTERN.GET_BY_ID_Task_Assignment)
  async GetInspectionByTaskAssignmentId(
    @Payload() payload: { task_assignment_id: string },
  ) {
    return this.inspectionService.GetInspectionByTaskAssignmentId(
      payload.task_assignment_id,
    );
  }
}
