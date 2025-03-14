import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { TaskAssignmentService } from './TaskAssigment.service'
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto';
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment';
import { AssignmentStatus  } from '@prisma/client-Task' 
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('task-assignments')

export class TaskAssignmentController {
  constructor(private readonly taskAssignmentService: TaskAssignmentService) {}

  @Post()
  @ApiBody({ type: CreateTaskAssignmentDto })
  async createTaskAssignment(@Body() createTaskAssignmentDto: CreateTaskAssignmentDto) {
    return this.taskAssignmentService.createTaskAssignment(createTaskAssignmentDto);
  }

  // Update an existing Task Assignment
  @Put(':taskAssignmentId')
  async updateTaskAssignment(
    @Param('taskAssignmentId') taskAssignmentId: string,
    @Body() updateTaskAssignmentDto: UpdateTaskAssignmentDto,
  ) {
    return this.taskAssignmentService.updateTaskAssignment(taskAssignmentId, updateTaskAssignmentDto);
  }

  // Delete a Task Assignment (change status to 'notcompleted')
  @Delete(':taskAssignmentId')
  async deleteTaskAssignment(@Param('taskAssignmentId') taskAssignmentId: string) {
    return this.taskAssignmentService.deleteTaskAssignment(taskAssignmentId);
  }

  // Get Task Assignments by User ID
  @Get('user/:userId')
  async getTaskAssignmentByUserId(@Param('userId') userId: string) {
    return this.taskAssignmentService.getTaskAssignmentByUserId(userId);
  }

  // Get Task Assignment by ID
  @Get(':taskAssignmentId')
  async getTaskAssignmentById(@Param('taskAssignmentId') taskAssignmentId: string) {
    return this.taskAssignmentService.getTaskAssignmentById(taskAssignmentId);
  }

  // Get all Task Assignments
  @Get()
  async getAllTaskAssignments() {
    return this.taskAssignmentService.getAllTaskAssignments();
  }

  // Reassign Task Assignment
  @Put(':taskAssignmentId/reassign')
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
    example: 'completed',  // Ví dụ về giá trị status
  })
  async getTaskAssignmentsByStatus(@Param('status') status: AssignmentStatus) {
    return this.taskAssignmentService.getTaskAssignmentsByStatus(status);
  }
}