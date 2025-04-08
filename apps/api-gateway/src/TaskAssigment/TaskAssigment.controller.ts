import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { TaskAssignmentService } from './TaskAssigment.service';
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto';
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment';
import { AssignmentStatus, Task } from '@prisma/client-Task';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { TaskAssignmentsController } from 'apps/Tasks/TaskAssignments/TaskAssignments.controller';

@Controller('task-assignments')
@ApiTags('task-assignments')
export class TaskAssignmentController {
  constructor(private readonly taskAssignmentService: TaskAssignmentService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new task assignment' })
  @ApiBody({ type: CreateTaskAssignmentDto })
  @ApiResponse({
    status: 201,
    description: 'Task assignment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTaskAssignment(
    @Body() createTaskAssignmentDto: CreateTaskAssignmentDto,
  ) {
    return this.taskAssignmentService.createTaskAssignment(
      createTaskAssignmentDto,
    );
  }

  // Update an existing Task Assignment
  @Put(':taskAssignmentId')
  @ApiOperation({ summary: 'Update a task assignment' })
  @ApiParam({ name: 'taskAssignmentId', description: 'Task assignment ID' })
  @ApiBody({ type: UpdateTaskAssignmentDto })
  @ApiResponse({
    status: 200,
    description: 'Task assignment updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Task assignment not found' })
  async updateTaskAssignment(
    @Param('taskAssignmentId') taskAssignmentId: string,
    @Body() updateTaskAssignmentDto: UpdateTaskAssignmentDto,
  ) {
    return this.taskAssignmentService.updateTaskAssignment(
      taskAssignmentId,
      updateTaskAssignmentDto,
    );
  }

  // Delete a Task Assignment (change status to 'notcompleted')
  @Delete(':taskAssignmentId')
  @ApiOperation({ summary: 'Delete a task assignment' })
  @ApiParam({ name: 'taskAssignmentId', description: 'Task assignment ID' })
  @ApiResponse({
    status: 200,
    description: 'Task assignment deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Task assignment not found' })
  async deleteTaskAssignment(
    @Param('taskAssignmentId') taskAssignmentId: string,
  ) {
    return this.taskAssignmentService.deleteTaskAssignment(taskAssignmentId);
  }

  // Get Task Assignments by User ID
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get task assignments by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns task assignments for the user',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getTaskAssignmentByUserId(@Param('userId') userId: string) {
    return this.taskAssignmentService.getTaskAssignmentByUserId(userId);
  }

  // Get Task Assignment by ID
  @Get(':taskAssignmentId')
  @ApiOperation({ summary: 'Get task assignment by ID' })
  @ApiParam({ name: 'taskAssignmentId', description: 'Task assignment ID' })
  @ApiResponse({ status: 200, description: 'Task assignment found' })
  @ApiResponse({ status: 404, description: 'Task assignment not found' })
  async getTaskAssignmentById(
    @Param('taskAssignmentId') taskAssignmentId: string,
  ) {
    console.log("🚀 ~ TaskAssignmentController ~ taskAssignmentId:", taskAssignmentId)
    return this.taskAssignmentService.getTaskAssignmentById(taskAssignmentId);
  }

  // Get all Task Assignments
  @Get()
  @ApiOperation({ summary: 'Get all task assignments with pagination and status filter' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'statusFilter',
    required: false,
    example: 'pending',
    description: 'Filter by assignment status',
    enum: AssignmentStatus,
  })
  async getAllTaskAssignments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('statusFilter') statusFilter?: AssignmentStatus,
  ) {
    return await this.taskAssignmentService.getAllTaskAssignments({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      statusFilter,
    });
  }

  // Reassign Task Assignment
  @Put(':taskAssignmentId/reassign')
  @ApiOperation({ summary: 'Reassign a task assignment to a new employee' })
  @ApiParam({ name: 'taskAssignmentId', description: 'Task assignment ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newEmployeeId: { type: 'string', example: '12345' },
      },
      required: ['newEmployeeId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Task assignment reassigned successfully',
  })
  @ApiResponse({ status: 404, description: 'Task assignment not found' })
  async reassignTaskAssignment(
    @Param('taskAssignmentId') taskAssignmentId: string,
    @Body() { newEmployeeId }: { newEmployeeId: string },
  ) {
    return this.taskAssignmentService.reassignTaskAssignment(
      taskAssignmentId,
      newEmployeeId,
    );
  }

  // Get Task Assignments by Status
  @Get('status/:status')
  @ApiOperation({ summary: 'Get task assignments by status' })
  @ApiParam({
    name: 'status',
    description:
      'The status of the task assignment (e.g., "completed", "pending","inprogress","reassigned")',
    type: String,
    example: 'completed',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns task assignments with the specified status',
  })
  async getTaskAssignmentsByStatus(@Param('status') status: AssignmentStatus) {
    return this.taskAssignmentService.getTaskAssignmentsByStatus(status);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get task assignments by task ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns task assignments for the specified task',
  })
  async getTaskAssignmentsByTaskId(@Param('taskId') taskId: string) {
    console.log("🚀 ~ TaskAssignmentController ~ getTaskAssignmentsByTaskId ~ taskId:", taskId)
    return this.taskAssignmentService.getTaskAssignmentsByTaskId(taskId);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign a task to an employee' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', example: '12345' },
        employeeId: { type: 'string', example: '67890' },
        description: { type: 'string', example: 'Fix the crack in building A, floor 3' }
      },
      required: ['taskId', 'employeeId', 'description'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Task assigned to employee successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Employee has unconfirmed tasks or unable to assign task'
  })
  @ApiResponse({
    status: 404,
    description: 'Task or employee not found'
  })
  async assignTaskToEmployee(
    @Body() payload: { taskId: string; employeeId: string; description: string },
  ) {
    return this.taskAssignmentService.assignTaskToEmployee(
      payload.taskId,
      payload.employeeId,
      payload.description
    );
  }

  @Put(':assignment_id/change-status')
  @ApiOperation({ summary: 'Change task assignment status' })
  @ApiParam({
    name: 'assignment_id',
    description: 'ID of the task assignment',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['Pending', 'Verified', 'Unverified', 'InFixing', 'Fixed', 'Confirmed', 'Reassigned'],
          example: 'InFixing'
        }
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Task assignment status changed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Task assignment not found'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status value'
  })
  async changeTaskAssignmentStatus(
    @Param('assignment_id') assignment_id: string,
    @Body() payload: { status: AssignmentStatus },
  ) {
    return this.taskAssignmentService.changeTaskAssignmentStatus({
      assignment_id,
      status: payload.status
    });
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get inspection details with crack information' })
  @ApiParam({ name: 'id', description: 'Task Assignment ID' })
  async getCrackDetailsbyTaskAssignmentId(@Param('id') id: string): Promise<any> {
    return this.taskAssignmentService.getTaskAssignmentDetails(id);
  }

  @Patch(':assignment_id/reassign')
  @ApiOperation({ summary: 'Update task assignment status to Reassigned' })
  @ApiParam({ name: 'assignment_id', description: 'Task assignment ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          example: 'The staff is unable to complete the task due to insufficient resources'
        }
      },
      required: ['description'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Task assignment status updated to Reassigned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Current status is not InFixing or Fixed'
  })
  @ApiResponse({
    status: 404,
    description: 'Task assignment not found'
  })
  async updateStatusTaskAssignmentToReassigned(
    @Param('assignment_id') assignment_id: string,
    @Body() payload: { description: string },
  ) {
    return this.taskAssignmentService.updateStatusTaskAssignmentToReassigned(
      assignment_id,
      payload.description
    );
  }

  @Get('employee/:employeeId/tasks')
  @ApiOperation({ summary: 'Get all tasks and task assignments by employee ID' })
  @ApiParam({ name: 'employeeId', description: 'ID of the employee' })
  @ApiResponse({
    status: 200,
    description: 'Returns all tasks and task assignments for the employee',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAllTaskAndTaskAssignmentByEmployeeId(
    @Param('employeeId') employeeId: string,
  ) {
    return this.taskAssignmentService.getAllTaskAndTaskAssignmentByEmployeeId(employeeId);
  }
}