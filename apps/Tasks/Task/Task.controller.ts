// areas.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TASKS_PATTERN } from 'libs/contracts/src/tasks/task.patterns';
import { TaskService } from './Task.service';
import { CreateTaskDto } from 'libs/contracts/src/tasks/create-Task.dto';
import { ChangeTaskStatusDto } from 'libs/contracts/src/tasks/ChangeTaskStatus.Dto ';
import { Status } from '@prisma/client-Task'; // Make sure Status is imported correctly
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { GetTasksByTypeDto } from '@app/contracts/tasks/get-tasks-by-type.dto';

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

  @MessagePattern(TASKS_PATTERN.DELETE_AND_RELATED)
  async deleteTaskAndRelated(@Payload() payload: { task_id: string }) {
    console.log('Received delete-task-and-related request with taskId:', payload.task_id);
    try {
      const result = await this.taskService.deleteTaskAndRelated(payload.task_id);
      console.log('deleteTaskAndRelated completed with result:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error in deleteTaskAndRelated controller:', error);
      throw error;
    }
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
        throw new Error('Thiếu scheduleJobId trong yêu cầu');
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

  @MessagePattern(TASKS_PATTERN.NOTIFICATION_THANKS_TO_RESIDENT)
  async notificationThankstoResident(@Payload() payload: { taskId: string; scheduleJobId?: string }) {
    console.log('Received notification-thanks-to-resident request with payload:', payload);
    try {
      // Validate required fields
      const { taskId, scheduleJobId } = payload;
      if (!taskId) {
        throw new Error('Thiếu taskId trong yêu cầu');
      }

      console.log(`Processing notification thanks to resident for task: ${taskId}`);

      // Call the service method
      const result = await this.taskService.notificationThankstoResident(taskId, scheduleJobId);
      console.log('notificationThankstoResident completed with result:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error in notificationThankstoResident controller:', error);
      throw error;
    }
  }

  @MessagePattern(TASKS_PATTERN.GET_BY_TYPE)
  async getTasksByType(@Payload() query: GetTasksByTypeDto) {
    console.log('Received get-tasks-by-type request with query:', query);
    try {
      const result = await this.taskService.getTasksByType(query);
      console.log('getTasksByType completed with result:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error in getTasksByType controller:', error);
      throw error;
    }
  }

  @MessagePattern(TASKS_PATTERN.COMPLETE_AND_REVIEW)
  async completeTaskAndReview(@Payload() payload: { taskId: string }) {
    console.log('Received complete-task-and-review request with taskId:', payload.taskId);
    try {
      const result = await this.taskService.completeTaskAndReview(payload.taskId);
      console.log('completeTaskAndReview completed with result:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error in completeTaskAndReview controller:', error);
      throw error;
    }
  }

  @MessagePattern(TASKS_PATTERN.GET_LATEST_ASSIGNMENT)
  async getLatestTaskAssignment(@Payload() payload: { taskId: string }) {
    console.log('Received get-latest-task-assignment request with taskId:', payload.taskId);
    try {
      const result = await this.taskService.getLatestTaskAssignment(payload.taskId);
      console.log('getLatestTaskAssignment completed');
      return result;
    } catch (error) {
      console.error('Error in getLatestTaskAssignment controller:', error);
      throw error;
    }
  }
}
