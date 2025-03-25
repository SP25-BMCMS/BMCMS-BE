import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards, Query } from '@nestjs/common'
import { TaskAssignmentService } from './TaskAssigment.service'
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto';
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment';
import { AssignmentStatus } from '@prisma/client-Task'
import { ApiBody, ApiOperation, ApiParam, ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';

@Controller('task-assignments')
@ApiTags('task-assignments')
export class TaskAssignmentController {
  constructor(private readonly taskAssignmentService: TaskAssignmentService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new task assignment' })
  @ApiBody({ type: CreateTaskAssignmentDto })
  @ApiResponse({ status: 201, description: 'Task assignment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTaskAssignment(@Body() createTaskAssignmentDto: CreateTaskAssignmentDto) {
    return this.taskAssignmentService.createTaskAssignment(createTaskAssignmentDto);
  }

  // Update an existing Task Assignment
  @Put(':taskAssignmentId')
  @ApiOperation({ summary: 'Update a task assignment' })
  @ApiParam({ name: 'taskAssignmentId', description: 'Task assignment ID' })
  @ApiBody({ type: UpdateTaskAssignmentDto })
  @ApiResponse({ status: 200, description: 'Task assignment updated successfully' })
  @ApiResponse({ status: 404, description: 'Task assignment not found' })
  async updateTaskAssignment(
    @Param('taskAssignmentId') taskAssignmentId: string,
    @Body() updateTaskAssignmentDto: UpdateTaskAssignmentDto,
  ) {
    return this.taskAssignmentService.updateTaskAssignment(taskAssignmentId, updateTaskAssignmentDto);
  }

  // Delete a Task Assignment (change status to 'notcompleted')
  @Delete(':taskAssignmentId')
  @ApiOperation({ summary: 'Delete a task assignment' })
  @ApiParam({ name: 'taskAssignmentId', description: 'Task assignment ID' })
  @ApiResponse({ status: 200, description: 'Task assignment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task assignment not found' })
  async deleteTaskAssignment(@Param('taskAssignmentId') taskAssignmentId: string) {
    return this.taskAssignmentService.deleteTaskAssignment(taskAssignmentId);
  }

  // Get Task Assignments by User ID
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get task assignments by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns task assignments for the user' })
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
  async getTaskAssignmentById(@Param('taskAssignmentId') taskAssignmentId: string) {
    return this.taskAssignmentService.getTaskAssignmentById(taskAssignmentId);
  }

  // Get all Task Assignments
  @Get()
  @ApiOperation({ summary: 'Get all task assignments with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page' })
  async getAllTaskAssignments(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return await this.taskAssignmentService.getAllTaskAssignments({
      page: Number(page) || 1,
      limit: Number(limit) || 10
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
        newEmployeeId: { type: 'string', example: '12345' }
      },
      required: ['newEmployeeId']
    }
  })
  @ApiResponse({ status: 200, description: 'Task assignment reassigned successfully' })
  @ApiResponse({ status: 404, description: 'Task assignment not found' })
  async reassignTaskAssignment(
    @Param('taskAssignmentId') taskAssignmentId: string,
    @Body() { newEmployeeId }: { newEmployeeId: string },
  ) {
    return this.taskAssignmentService.reassignTaskAssignment(taskAssignmentId, newEmployeeId);
  }

  // Get Task Assignments by Status
  @Get('status/:status')
  @ApiOperation({ summary: 'Get task assignments by status' })
  @ApiParam({
    name: 'status',
    description: 'The status of the task assignment (e.g., "completed", "pending","inprogress","reassigned")',
    type: String,
    example: 'completed',
  })
  @ApiResponse({ status: 200, description: 'Returns task assignments with the specified status' })
  async getTaskAssignmentsByStatus(@Param('status') status: AssignmentStatus) {
    return this.taskAssignmentService.getTaskAssignmentsByStatus(status);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get task assignments by task ID' })
  @ApiResponse({ status: 200, description: 'Returns task assignments for the specified task' })
  async getTaskAssignmentsByTaskId(@Param('taskId') taskId: string) {
    return this.taskAssignmentService.getTaskAssignmentsByTaskId(taskId);
  }
}