import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc, ClientProxy, RpcException } from '@nestjs/microservices';
import { AssignmentStatus, PrismaClient } from '@prisma/client-Task';
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto';
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment';
import { PrismaService } from '../../users/prisma/prisma.service';
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto';
import { ApiResponse } from '@nestjs/swagger';
import { firstValueFrom, Observable } from 'rxjs';
const CRACK_PATTERNS = {
  GET_DETAILS: { cmd: 'get-crack-report-by-id' }
};

interface UserService {
  GetUserByIdForTaskAssignmentDetail(data: { userId: string }): Observable<{
    isSuccess: boolean
    message: string
    data: {
      userId: string
      username: string
    }
  }>
}

@Injectable()
export class TaskAssignmentsService {
  private prisma = new PrismaClient();
  private userService: UserService

  constructor(
    @Inject('USERS_CLIENT') private readonly usersClient: ClientGrpc,
    @Inject('CRACK_CLIENT') private readonly crackClient: ClientProxy,
  ) { this.userService = this.usersClient.getService<UserService>('UserService') }

  async createTaskAssignment(createTaskAssignmentDto: CreateTaskAssignmentDto) {
    try {
      const newAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: createTaskAssignmentDto.task_id,
          employee_id: createTaskAssignmentDto.employee_id,
          description: createTaskAssignmentDto.description,
          status: createTaskAssignmentDto.status,
        },
      });
      return {
        statusCode: 201,
        message: 'Task assignment created successfully',
        data: newAssignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment creation failed',
      });
    }
  }

  async updateTaskAssignment(
    taskAssignmentId: string,
    updateTaskAssignmentDto: UpdateTaskAssignmentDto,
  ) {
    try {
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: taskAssignmentId },
        data: {
          task_id: updateTaskAssignmentDto.task_id,
          employee_id: updateTaskAssignmentDto.employee_id,
          description: updateTaskAssignmentDto.description,
          status: updateTaskAssignmentDto.status,
        },
      });
      return {
        statusCode: 200,
        message: 'Task assignment updated successfully',
        data: updatedAssignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment update failed',
      });
    }
  }

  async deleteTaskAssignment(taskAssignmentId: string) {
    try {
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: taskAssignmentId },
        data: { status: AssignmentStatus.Notcompleted }, // Change status to 'notcompleted'
      });
      return {
        statusCode: 200,
        message: 'Task assignment marked as not completed',
        data: updatedAssignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment update failed',
      });
    }
  }
  async getTaskAssignmentByUserId(userId: string) {
    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: { employee_id: userId },
      });
      return {
        statusCode: 200,
        message: 'Task assignments fetched successfully',
        data: assignments,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments for user',
      });
    }
  }

  async getTaskAssignmentById(taskAssignmentId: string) {
    try {
      console.log('Finding task assignment with ID:', taskAssignmentId);
      const assignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignmentId },
      });
      if (!assignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }
      return {
        statusCode: 200,
        message: 'Task assignment fetched successfully',
        data: assignment,
      };
    } catch (error) {
      console.error('Error in getTaskAssignmentById:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignment',
      });
    }
  }

  async getAllTaskAssignments(
    paginationParams: PaginationParams = { page: 1, limit: 10 },
  ): Promise<PaginationResponseDto<any>> {
    try {
      const page = Number(paginationParams.page) || 1;
      const limit = Number(paginationParams.limit) || 10;
      const skip = (page - 1) * limit;
      const statusFilter = paginationParams.statusFilter;

      // Build where clause for filtering
      const whereClause = statusFilter ? { status: statusFilter as AssignmentStatus } : {};

      // Get total count with filter
      const total = await this.prisma.taskAssignment.count({
        where: whereClause,
      });

      // Get paginated task assignments with filter
      const taskAssignments = await this.prisma.taskAssignment.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          task: true,
          // assignedTo: true
        },
        orderBy: {
          //assignedAt: 'desc'
        },
      });

      const responseData = {
        statusCode: 200,
        message: 'Danh sách phân công công việc',
        data: taskAssignments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      return responseData;
    } catch (error) {
      console.error('Error in getAllTaskAssignments:', error);
      const errorData = {
        statusCode: 500,
        message: error.message,
        data: [],
        pagination: {
          total: 0,
          page: Number(paginationParams.page) || 1,
          limit: Number(paginationParams.limit) || 10,
          totalPages: 0,
        },
      };

      return errorData;
    }
  }

  async reassignTaskAssignment(
    taskAssignmentId: string,
    newEmployeeId: string,
  ) {
    try {
      // Tìm task assignment cũ
      const existingAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignmentId },
        include: {
          task: true
        }
      });
      if (existingAssignment.employee_id == newEmployeeId) {
        throw new RpcException({
          statusCode: 404,
          message: 'New employee is the same as the old employee please choose another employee',
        });
      }

      if (!existingAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }

      // Cập nhật trạng thái assignment cũ thành Reassigned
      const oldAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: taskAssignmentId },
        data: {
          status: AssignmentStatus.Reassigned,
          description: `${existingAssignment.description} Reassigned to new employee`
        },
        include: {
          task: true
        }
      });

      // Tạo assignment mới với dữ liệu từ assignment cũ nhưng employee mới
      const newAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: existingAssignment.task_id,
          employee_id: newEmployeeId,
          description: `Reassigned from assignment ${taskAssignmentId}\n Original description: ${existingAssignment.description}`,
          status: AssignmentStatus.Pending,
        },
        include: {
          task: true
        }
      });

      return {
        statusCode: 200,
        message: 'Task reassigned successfully',
        data: {
          oldAssignment,
          newAssignment
        }
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Error reassigning task assignment: ' + error.message
      });
    }
  }

  async changeTaskAssignmentStatus(assignment_id: string, status: AssignmentStatus) {
    try {
      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id },
      });

      if (!existingAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }

      // Cập nhật trạng thái
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id },
        data: { status },
        include: {
          task: true,
        },
      });

      return {
        statusCode: 200,
        message: `Task assignment status changed to ${status} successfully`,
        data: updatedAssignment,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: `Failed to change task assignment status: ${error.message}`,
      });
    }
  }

  async getTaskAssignmentByStatus(status: AssignmentStatus) {
    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: { status },
      });
      return {
        statusCode: 200,
        message: 'Task assignments by status fetched successfully',
        data: assignments,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments by status',
      });
    }
  }

  async assignTaskToEmployee(taskId: string, employeeId: string, description: string) {
    try {
      // Check if the employee has any unconfirmed tasks
      const unconfirmedTasks = await this.prisma.taskAssignment.findMany({
        where: {
          employee_id: employeeId,
          status: {
            notIn: [AssignmentStatus.Confirmed]
          }
        }
      });

      if (unconfirmedTasks.length > 0) {
        return {
          statusCode: 400,
          message: 'Staff has unconfirmed tasks. Cannot assign new task.',
          data: null
        };
      }

      // Check if the task exists
      const task = await this.prisma.task.findUnique({
        where: { task_id: taskId }
      });

      if (!task) {
        return {
          statusCode: 404,
          message: 'Task not found',
          data: null
        };
      }

      // Create new task assignment
      const newAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: taskId,
          employee_id: employeeId,
          description: description,
          status: AssignmentStatus.Pending
        }
      });

      return {
        statusCode: 201,
        message: 'Task assigned to employee successfully',
        data: newAssignment
      };
    } catch (error) {
      console.error('Error assigning task to employee:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to assign task to employee',
        error: error.message
      });
    }
  }

  async getTaskAssignmentByTaskId(taskId: string) {
    try {
      const assignment = await this.prisma.task.findUnique({
        where: { task_id: taskId },
        include: {
          taskAssignments: true,
        },
      });
      if (!assignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }
      return {
        statusCode: 200,
        message: 'Task assignment fetched successfully',
        data: assignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignment',
      });
    }
  }

  async getDetails(taskAssignment_id: string) {
    try {
      // 1. Get inspection with task assignment
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignment_id },
        include: {
          task: true
        }
      });
      if (!taskAssignment) {
        return {
          success: false,
          message: 'taskAssignment not found',
          data: null
        };
      }

      const result: any = {
        assignment_id: taskAssignment.assignment_id,
        task_id: taskAssignment.task_id,
        description: taskAssignment.description,
        employee: null, // Placeholder for employee info
        status: taskAssignment.status,
        created_at: taskAssignment.created_at,
        updated_at: taskAssignment.updated_at,
        task: taskAssignment.task
      };

      // 2. Get task info
      const task = taskAssignment.task;
      console.log(task);

      // 3. If crack_id exists, get crack info
      if (task.crack_id) {
        console.log("🚀 ~ InspectionsService ~ getInspectionDetails ~ task.crack_id:", task.crack_id)
        const crackInfo = await firstValueFrom(
          this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
        );
        result.crackInfo = crackInfo;
      }

      // 4. Get employee info from User service
      try {
        const employeeInfo = await firstValueFrom(
          this.userService.GetUserByIdForTaskAssignmentDetail({ userId: taskAssignment.employee_id })
        );

        if (employeeInfo && employeeInfo.isSuccess && employeeInfo.data) {
          result.employee = {
            employee_id: employeeInfo.data.userId,
            username: employeeInfo.data.username
          };
        }
      } catch (error) {
        console.error('Error getting employee details:', error.message);
        result.employee = {
          employee_id: taskAssignment.employee_id,
          username: 'Unknown'
        };
      }

      // 5. If schedule_id exists, get schedule info (you can add this later)
      if (task.schedule_job_id) {
        // Add schedule info retrieval here
      }

      return {
        success: true,
        message: 'Inspection details retrieved successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error retrieving inspection details',
        data: error.message
      };
    }
  }

  async updateStatusTaskAssignmentToReassigned(assignment_id: string, description: string) {
    try {
      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id },
      });

      if (!existingAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }

      // Kiểm tra xem status hiện tại có phải là InFixing hoặc Fixed không
      if (existingAssignment.status !== AssignmentStatus.InFixing &&
        existingAssignment.status !== AssignmentStatus.Fixed) {
        throw new RpcException({
          statusCode: 400,
          message: 'Task assignment status must be InFixing or Fixed to reassign',
        });
      }

      // Nối chuỗi description mới với description hiện tại
      const updatedDescription =
        `${existingAssignment.description}\n---\nReassigned reason: ${description}`;

      // Cập nhật trạng thái thành Reassigned và cập nhật description
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id },
        data: {
          status: AssignmentStatus.Reassigned,
          description: updatedDescription
        },
        include: {
          task: true,
        },
      });

      return {
        statusCode: 200,
        message: 'Task assignment status changed to Reassigned successfully',
        data: updatedAssignment,
      };
    } catch (error) {
      // Nếu lỗi là RpcException, ném lại nguyên vẹn
      if (error instanceof RpcException) {
        throw error;
      }

      // Xử lý các lỗi khác, trả về 400 thay vì 500
      throw new RpcException({
        statusCode: 400,
        message: `Failed to change task assignment status: ${error.message}`,
      });
    }
  }

  async getAllTaskAndTaskAssignmentByEmployeeId(employeeId: string) {
    try {
      // Find all task assignments for the employee
      const taskAssignments = await this.prisma.taskAssignment.findMany({
        where: { employee_id: employeeId },
        include: {
          task: true, // Include the related task for each assignment
        },
        orderBy: {
          created_at: 'desc', // Order by creation date, most recent first
        },
      });

      if (taskAssignments.length === 0) {
        return {
          statusCode: 200,
          message: 'No task assignments found for this employee',
          data: [],
        };
      }

      return {
        statusCode: 200,
        message: 'Tasks and assignments fetched successfully',
        data: taskAssignments,
      };
    } catch (error) {
      console.error('Error fetching tasks and assignments for employee:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to fetch tasks and assignments for employee',
        error: error.message,
      });
    }
  }
}