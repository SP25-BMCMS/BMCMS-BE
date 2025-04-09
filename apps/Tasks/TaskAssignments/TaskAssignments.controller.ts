import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TASKASSIGNMENT_PATTERN } from 'libs/contracts/src/taskAssigment/taskAssigment.patterns';
import { TaskAssignmentsService } from './TaskAssignments.service';
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto';
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment';
import { AssignmentStatus } from '@prisma/client-Task';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { UpdateStatusCreateWorklogDto } from 'libs/contracts/src/taskAssigment/update-status-create-worklog.dto';

@Controller('task-assignments')
export class TaskAssignmentsController {
  constructor(
    private readonly taskAssignmentService: TaskAssignmentsService
  ) { }

  @MessagePattern(TASKASSIGNMENT_PATTERN.CREATE)
  async createTaskAssignment(
    @Payload() createTaskAssignmentDto: CreateTaskAssignmentDto,
  ) {
    return this.taskAssignmentService.createTaskAssignment(
      createTaskAssignmentDto,
    );
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.UPDATE)
  async updateTaskAssignment(
    @Payload()
    payload: {
      taskAssignmentId: string;
      updateTaskAssignmentDto: UpdateTaskAssignmentDto;
    },
  ) {
    return this.taskAssignmentService.updateTaskAssignment(
      payload.taskAssignmentId,
      payload.updateTaskAssignmentDto,
    );
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.DELELTE)
  async deleteTaskAssignment(@Payload() payload: { taskAssignmentId: string }) {
    return this.taskAssignmentService.deleteTaskAssignment(payload.taskAssignmentId);
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.GET_BY_USERID)
  async getTaskAssignmentByUserId(@Payload() payload: { userId: string }) {
    return this.taskAssignmentService.getTaskAssignmentByUserId(payload.userId);
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.GET_BY_ID)
  async getTaskAssignmentById(
    @Payload() payload: { assignment_id: string },
  ) {
    console.log('Received assignment_id:', payload.assignment_id);
    return this.taskAssignmentService.getTaskAssignmentById(
      payload.assignment_id,
    );
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.GET_BY_TASKID)
  async getTaskAssignmentByTaskId(
    @Payload() payload: { task_id: string },
  ) {
    return this.taskAssignmentService.getTaskAssignmentByTaskId(
      payload.task_id,
    );
  }


  @MessagePattern(TASKASSIGNMENT_PATTERN.GET)
  async getAllTaskAssignments(@Payload() paginationParams: PaginationParams) {
    return this.taskAssignmentService.getAllTaskAssignments(paginationParams);
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.REASSIGN)
  async reassignTaskAssignment(
    @Payload() payload: { taskAssignmentId: string; newEmployeeId: string },
  ) {
    return this.taskAssignmentService.reassignTaskAssignment(
      payload.taskAssignmentId,
      payload.newEmployeeId,
    );
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.GET_BY_STATUS)
  async getTaskAssignmentByStatus(
    @Payload() payload: { status: AssignmentStatus },
  ) {
    return this.taskAssignmentService.getTaskAssignmentByStatus(payload.status);
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.ASSIGN_TO_EMPLOYEE)
  async assignTaskToEmployee(
    @Payload() payload: { taskId: string; employeeId: string; description: string },
  ) {
    return this.taskAssignmentService.assignTaskToEmployee(
      payload.taskId,
      payload.employeeId,
      payload.description
    );
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.CHANGE_STATUS)
  async changeTaskAssignmentStatus(
    @Payload() payload: { assignment_id: string; status: AssignmentStatus },
  ) {
    return this.taskAssignmentService.changeTaskAssignmentStatus(
      payload.assignment_id,
      payload.status
    );
  }


  @MessagePattern(TASKASSIGNMENT_PATTERN.GET_DETAILS)
  async getCrackDetailsbyTaskAssignmentId(@Payload() taskAssignment_id: string) {
    return this.taskAssignmentService.getDetails(taskAssignment_id);
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.UPDATE_STATUS_TO_REASSIGNED)
  async updateStatusTaskAssignmentToReassigned(
    @Payload() payload: { assignment_id: string; description: string },
  ) {
    return this.taskAssignmentService.updateStatusTaskAssignmentToReassigned(
      payload.assignment_id,
      payload.description
    );
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.GET_ALL_BY_EMPLOYEE_ID)
  async getAllTaskAndTaskAssignmentByEmployeeId(@Payload() employeeId: string) {
    return this.taskAssignmentService.getAllTaskAndTaskAssignmentByEmployeeId(employeeId);
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.EXPORT_COST_PDF)
  async exportCostPdf(@Payload() payload: { taskId: string }) {
    return this.taskAssignmentService.exportCostPdf(payload.taskId);
  }

  @MessagePattern(TASKASSIGNMENT_PATTERN.UPDATE_STATUS_CREATE_WORKLOG)
  async updateTaskAssignmentStatusToCreateWorklog(
    @Payload() payload: { assignment_id: string; status: AssignmentStatus },
  ) {
    return this.taskAssignmentService.updateTaskAssignmentStatusToCreateWorklog(
      payload
    );
  }
}
