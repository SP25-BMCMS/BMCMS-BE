// areas.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TASKS_PATTERN } from 'libs/contracts/src/tasks/task.patterns';
import { TaskService } from './Task.service';
import { CreateTaskDto } from 'libs/contracts/src/tasks/create-Task.dto';
import { ChangeTaskStatusDto } from 'libs/contracts/src/tasks/ChangeTaskStatus.Dto ';
import { Status } from '@prisma/client-Task'; // Make sure Status is imported correctly
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';

@Controller('task')
export class TasksController {
  constructor(private readonly taskService: TaskService) { }

  @MessagePattern(TASKS_PATTERN.CREATE)
  async createTask(@Payload() createTaskDto: CreateTaskDto) {
    return this.taskService.createTask(createTaskDto);
  }

  @MessagePattern(TASKS_PATTERN.UPDATE)
  async updateTask(@Payload() payload: any) {
    return this.taskService.updateTask(payload.task_id, payload);
  }

  @MessagePattern(TASKS_PATTERN.GET_BY_ID)
  async getTaskById(@Payload() payload: { task_id: string }) {
    return this.taskService.getTaskById(payload.task_id);
  }

  @MessagePattern(TASKS_PATTERN.DELELTE)
  async deleteTask(@Payload() payload: { task_id: string }) {
    return this.taskService.deleteTask(payload.task_id);
  }

  // @MessagePattern(TASKS_PATTERN.CHANGE_STATUS)
  // async changeTaskStatus(@Payload() payload: { taskid ,ChangeTaskStatusDto}) {
  //   return this.taskService.changeTaskStatus(payload.taskid, payload.ChangeTaskStatusDto);
  // }
  @MessagePattern(TASKS_PATTERN.CHANGE_STATUS)
  async changeTaskStatus(
    @Payload() payload: { task_id: string; status: string },
  ) {
    console.log(
      '🚀 ~ TasksController ~ changeTaskStatus ~ status:',
      payload.status,
    );
    const { task_id, status } = payload;

    // Pass the correct status enum value to the service
    return this.taskService.changeTaskStatus(task_id, status);
  }

  @MessagePattern(TASKS_PATTERN.GET)
  async getAllTasks(@Payload() data: PaginationParams = {}) {
    console.log("🚀 ~ TasksController ~ getAllTasks ~ getAllTasks:")
    return this.taskService.getAllTasks(data);
  }

  @MessagePattern(TASKS_PATTERN.GET_BY_STATUS)
  async getTasksByStatus(@Payload() payload: { status: Status }) {
    return this.taskService.getTasksByStatus(payload.status);
  }

  @MessagePattern({ cmd: 'get-crack-id-by-task' })
  async getCrackIdByTask(@Payload() payload: { taskId: string }) {
    return this.taskService.getCrackIdByTask(payload.taskId);
  }

  @MessagePattern({ cmd: 'create-task-for-schedule-job' })
  async createTaskForScheduleJob(@Payload() payload: any) {
    console.log('Received create-task-for-schedule-job request with payload:', payload);
    try {
      // Extract scheduleJobId from multiple possible input formats
      const scheduleJobId = payload.scheduleJobId ||
        payload.schedule_job_id ||
        (typeof payload === 'string' ? payload : null);

      if (!scheduleJobId) {
        throw new Error('Missing scheduleJobId in request payload');
      }

      console.log('Starting task creation for schedule job:', scheduleJobId);

      // Extract staffId if available
      const staffId = payload.staffId || payload.staff_id;

      const result = await this.taskService.createTaskForScheduleJob(scheduleJobId, staffId);
      console.log('createTaskForScheduleJob completed with result:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error in createTaskForScheduleJob controller:', error);
      throw error;
    }
  }
}
