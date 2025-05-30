import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { CreateWorkLogDto } from '@app/contracts/Worklog/create-Worklog.dto'
import { UpdateWorkLogDto } from '@app/contracts/Worklog/update.Worklog'
import { UpdateWorkLogStatusDto } from '@app/contracts/Worklog/update.Worklog-status'
import { WorkLogResponseDto } from '@app/contracts/Worklog/Worklog.dto'
import { NotificationType } from '@app/contracts/notifications/notification.dto'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { Injectable, Inject } from '@nestjs/common'
import { RpcException, ClientProxy } from '@nestjs/microservices'
import { PrismaClient } from '@prisma/client-Task'
import { $Enums } from '@prisma/client-Task'
import { PrismaService } from '../../users/prisma/prisma.service'
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto'
import { firstValueFrom } from 'rxjs'
import { catchError } from 'rxjs/operators'

const CRACKS_CLIENT = 'CRACKS_CLIENT';
const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';

@Injectable()
export class WorkLogService {
  private prisma = new PrismaClient();

  constructor(
    private prismaService: PrismaService,
    @Inject(CRACKS_CLIENT) private readonly crackClient: ClientProxy,
    @Inject(NOTIFICATION_CLIENT) private readonly notificationClient: ClientProxy
  ) { }

  // Create WorkLog for Task
  async createWorkLogForTask(
    createWorkLogForTaskDto: CreateWorkLogDto,
  ): Promise<ApiResponse<WorkLogResponseDto>> {
    try {
      const newWorkLog = await this.prisma.workLog.create({
        data: {
          task_id: createWorkLogForTaskDto.task_id,
          title: createWorkLogForTaskDto.title,
          description: createWorkLogForTaskDto.description,
          status: createWorkLogForTaskDto.status ? createWorkLogForTaskDto.status as $Enums.WorkLogStatus : $Enums.WorkLogStatus.INIT_INSPECTION,
        },
      })
      return new ApiResponse<WorkLogResponseDto>(
        true,
        'Tạo nhật ký công việc thành công',
        newWorkLog,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: error.message,
      })
    }
  }

  // Get WorkLogs by TaskId
  async getWorkLogsByTaskId(
    task_id: string,
  ): Promise<ApiResponse<WorkLogResponseDto[]>> {
    try {
      const workLogs = await this.prisma.workLog.findMany({
        where: { task_id },
      })
      return new ApiResponse<WorkLogResponseDto[]>(
        true,
        'Lấy nhật ký công việc theo mã công việc thành công',
        workLogs,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy nhật ký công việc theo mã công việc',
      })
    }
  }

  // Get WorkLog by ID
  async getWorkLogById(
    worklog_id: string,
  ): Promise<ApiResponse<WorkLogResponseDto>> {
    try {
      const workLog = await this.prisma.workLog.findUnique({
        where: { worklog_id },
      })
      if (!workLog) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy nhật ký công việc',
        })
      }
      return new ApiResponse<WorkLogResponseDto>(
        true,
        'Lấy nhật ký công việc theo ID thành công',
        workLog,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy nhật ký công việc theo ID',
      })
    }
  }

  // Update WorkLog Status
  async updateWorkLogStatus(
    updateWorkLogStatusDto: UpdateWorkLogStatusDto,
  ): Promise<ApiResponse<WorkLogResponseDto>> {
    try {
      const { worklog_id, status } = updateWorkLogStatusDto
      console.log(
        '🚀 ~ WorkLogService ~ updateWorkLogStatus ~ worklog_id:',
        worklog_id,
      )

      const updatedWorkLog = await this.prisma.workLog.update({
        where: { worklog_id: updateWorkLogStatusDto.worklog_id },
        data: {
          status: updateWorkLogStatusDto.status,
        },
      })
      return new ApiResponse<WorkLogResponseDto>(
        true,
        'Cập nhật nhật ký công việc thành công',
        updatedWorkLog,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Cập nhật trạng thái nhật ký công việc thất bại',
      })
    }
  }

  async getAllWorklogs(paginationParams?: {
    page?: number
    limit?: number
    search?: string
  }) {
    try {
      // Default values if not provided
      const page = paginationParams?.page || 1
      const limit = paginationParams?.limit || 10
      const search = paginationParams?.search || ''

      // Calculate skip value for pagination
      const skip = (page - 1) * limit

      // Create where condition for search
      const where: any = {}
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      // Get paginated data
      const [worklogs, total] = await Promise.all([
        this.prisma.workLog.findMany({
          where,
          skip,
          take: limit,
          include: {
            task: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.workLog.count({ where }),
      ])

      if (worklogs.length === 0) {
        return {
          statusCode: 200,
          message: 'Không tìm thấy nhật ký công việc nào',
          data: [],
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        }
      }

      return {
        statusCode: 200,
        message: 'Lấy danh sách nhật ký công việc thành công',
        data: worklogs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      }
    } catch (error) {
      console.error('Error retrieving worklogs:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách nhật ký công việc!',
      })
    }
  }

  // Get WorkLogs by ResidentId (reportBy từ CrackReport)
  async getWorklogsByResidentId(
    residentId: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      // Tìm các task có crack_id liên quan đến residentId (reportBy)
      const tasks = await this.prisma.task.findMany({
        where: {
          // Chỉ lấy những task có crack_id (không phải null hoặc rỗng)
          crack_id: {
            not: '',
          },
        },
        include: {
          // Lấy các task assignment liên quan đến task
          taskAssignments: true,
          // Lấy các worklog liên quan đến task
          workLogs: true
        }
      });

      // Lọc các task dựa trên CrackReport.reportBy = residentId
      const filteredTasks = [];

      for (const task of tasks) {
        try {
          // Sử dụng CRACK_CLIENT để lấy thông tin crack report
          const crackData = await firstValueFrom(
            this.crackClient.send(
              { cmd: 'get-crack-report-by-id' },
              task.crack_id
            )
          );

          console.log(`Crack data for task ${task.task_id}:`, JSON.stringify(crackData, null, 2));

          // Kiểm tra nếu reportedBy khớp với residentId
          // Kiểm tra cả trường hợp reportedBy là object hoặc string
          const reportedBy = crackData?.data?.[0]?.reportedBy; // [0] vì data là array
          let reporterId = null;

          if (typeof reportedBy === 'object' && reportedBy !== null) {
            reporterId = reportedBy.userId;
          } else if (typeof reportedBy === 'string') {
            reporterId = reportedBy;
          }

          console.log(`ReporterId: ${reporterId}, ResidentId: ${residentId}`);

          if (reporterId === residentId) {
            // Thêm thông tin crack vào task
            task['crackReport'] = crackData.data[0]; // [0] vì data là array
            filteredTasks.push(task);
          }
        } catch (error) {
          console.error(`Error fetching crack data for task ${task.task_id}:`, error);
        }
      }

      // Nếu không tìm thấy task nào
      if (filteredTasks.length === 0) {
        return new ApiResponse<any[]>(
          true,
          'Không tìm thấy nhật ký công việc nào cho cư dân này',
          []
        );
      }

      // Xử lý kết quả để có định dạng phù hợp
      const result = filteredTasks.map(task => {
        return {
          task_id: task.task_id,
          description: task.description,
          status: task.status,
          crack_id: task.crack_id,
          crackReport: task.crackReport,
          taskAssignments: task.taskAssignments,
          workLogs: task.workLogs
        };
      });

      return new ApiResponse<any[]>(
        true,
        'Lấy nhật ký công việc thành công',
        result
      );
    } catch (error) {
      console.error('Error retrieving worklogs by resident ID:', error);
      // Sửa lỗi tại đây - thay vì throw RpcException với object, dùng error message
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException('Lỗi khi lấy nhật ký công việc theo ID cư dân');
    }
  }

  // Execute Task - create worklog EXECUTE_CRACKS, update task status to Assigned, update crackReport status to InFixing
  async executeTask(taskAssignmentId: string): Promise<ApiResponse<any>> {
    try {
      // First, find the task assignment to get the task_id
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignmentId },
        include: { task: true }
      });

      if (!taskAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment không tồn tại'
        });
      }

      // Get the task and crack_id
      const task = taskAssignment.task;
      const crackId = task.crack_id;
      const staffLeaderId = taskAssignment.employee_id; // StaffLeader ID

      // 1. Update the Task status to "Assigned"
      const updatedTask = await this.prisma.task.update({
        where: { task_id: task.task_id },
        data: { status: $Enums.Status.Assigned }
      });

      // 2. Create a new WorkLog with status "EXECUTE_CRACKS"
      const newWorkLog = await this.prisma.workLog.create({
        data: {
          task_id: task.task_id,
          title: 'Thực hiện sửa chữa vết nứt',
          description: 'Nhân viên bắt đầu thực hiện sửa chữa vết nứt',
          status: $Enums.WorkLogStatus.EXECUTE_CRACKS
        }
      });

      // 3. Update the CrackReport status to "InFixing" using the CRACKS_CLIENT
      const updatedCrackReport = await firstValueFrom(
        this.crackClient.send(
          { cmd: 'update-crack-report-for-all-status' },
          {
            crackReportId: crackId,
            dto: { status: 'InFixing' }
          }
        ).pipe(
          catchError(error => {
            console.error('Error updating crack report status:', error);
            throw new RpcException({
              statusCode: error.statusCode || 500,
              message: error.message || 'Lỗi khi cập nhật trạng thái vết nứt'
            });
          })
        )
      );

      // 4. Send notification to staffLeader
      try {
        await firstValueFrom(
          this.notificationClient.emit(
            NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION,
            {
              userId: staffLeaderId,
              title: 'Xác nhận thực hiện sửa chữa',
              content: `Cư dân đã xác nhận để nhân viên bắt đầu thực hiện sửa chữa cho nhiệm vụ: ${task.title || 'Sửa chữa vết nứt'}`,
              type: NotificationType.TASK_STATUS_UPDATE,
              link: `/tasks/${task.task_id}`,
              relatedId: task.task_id
            }
          ).pipe(
            catchError(error => {
              console.error('Error sending notification:', error);
              // Don't throw here, just log the error
              return [];
            })
          )
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Continue execution, don't fail the whole process if notification fails
      }

      return new ApiResponse(
        true,
        'Đã bắt đầu thực hiện sửa chữa vết nứt',
        {
          task: updatedTask,
          workLog: newWorkLog,
          crackReport: updatedCrackReport
        }
      );
    } catch (error) {
      console.error('Error in executeTask service:', error);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Lỗi khi thực hiện task'
      });
    }
  }

  // Silent update for crack report status (without notifications)
  async updateCrackStatusSilent(crackReportId: string, status: string): Promise<any> {
    try {
      // Call the Cracks microservice with a special flag to suppress notifications
      return await firstValueFrom(
        this.crackClient.send(
          { cmd: 'update-crack-report-status-silent' },
          {
            crackReportId,
            status
          }
        ).pipe(
          catchError(error => {
            console.error('Error updating crack report status silently:', error);
            throw new RpcException({
              statusCode: error.statusCode || 500,
              message: error.message || 'Lỗi khi cập nhật trạng thái vết nứt'
            });
          })
        )
      );
    } catch (error) {
      console.error('Error in updateCrackStatusSilent:', error);
      throw error;
    }
  }

  // Cancel Task - create worklog CANCELLED, update task status to Completed, update crackReport status to Rejected
  async cancelTask(taskAssignmentId: string): Promise<ApiResponse<any>> {
    try {
      // First, find the task assignment to get the task_id
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignmentId },
        include: { task: true }
      });

      if (!taskAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment không tồn tại'
        });
      }

      // Get the task and crack_id
      const task = taskAssignment.task;
      const crackId = task.crack_id;
      const staffLeaderId = taskAssignment.employee_id; // StaffLeader ID

      // 1. Update the Task status to "Completed"
      const updatedTask = await this.prisma.task.update({
        where: { task_id: task.task_id },
        data: { status: $Enums.Status.Completed }
      });

      // 2. Create a new WorkLog with status "CANCELLED"
      const newWorkLog = await this.prisma.workLog.create({
        data: {
          task_id: task.task_id,
          title: 'Hủy công việc sửa chữa',
          description: 'Đã hủy công việc sửa chữa vết nứt',
          status: $Enums.WorkLogStatus.CANCELLED
        }
      });

      // 3. Update the CrackReport status to "Rejected" SILENTLY (without notifications to resident)
      const updatedCrackReport = await this.updateCrackStatusSilent(crackId, 'Rejected');

      // 4. Send notification ONLY to staffLeader
      try {
        await firstValueFrom(
          this.notificationClient.emit(
            NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION,
            {
              userId: staffLeaderId,
              title: 'Từ chối thực hiện sửa chữa',
              content: `Cư dân đã từ chối thực hiện sửa chữa cho nhiệm vụ: ${task.title || 'Sửa chữa vết nứt'}`,
              type: NotificationType.TASK_STATUS_UPDATE,
              link: `/tasks/${task.task_id}`,
              relatedId: task.task_id
            }
          ).pipe(
            catchError(error => {
              console.error('Error sending notification:', error);
              // Don't throw here, just log the error
              return [];
            })
          )
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Continue execution, don't fail the whole process if notification fails
      }

      return new ApiResponse(
        true,
        'Đã hủy công việc sửa chữa vết nứt',
        {
          task: updatedTask,
          workLog: newWorkLog,
          crackReport: updatedCrackReport
        }
      );
    } catch (error) {
      console.error('Error in cancelTask service:', error);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Lỗi khi hủy công việc'
      });
    }
  }
}
