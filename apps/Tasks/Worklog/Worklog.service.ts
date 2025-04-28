import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { CreateWorkLogDto } from '@app/contracts/Worklog/create-Worklog.dto'
import { UpdateWorkLogDto } from '@app/contracts/Worklog/update.Worklog'
import { UpdateWorkLogStatusDto } from '@app/contracts/Worklog/update.Worklog-status'
import { WorkLogResponseDto } from '@app/contracts/Worklog/Worklog.dto'
import { Injectable, Inject } from '@nestjs/common'
import { RpcException, ClientProxy } from '@nestjs/microservices'
import { PrismaClient } from '@prisma/client-Task'
import { $Enums } from '@prisma/client-Task'
import { PrismaService } from '../../users/prisma/prisma.service'
import { PaginationParams } from '../../../libs/contracts/src/Pagination/pagination.dto'
import { firstValueFrom } from 'rxjs'

const CRACKS_CLIENT = 'CRACKS_CLIENT';

@Injectable()
export class WorkLogService {
  private prisma = new PrismaClient();

  constructor(
    private prismaService: PrismaService,
    @Inject(CRACKS_CLIENT) private readonly crackClient: ClientProxy
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
          status: $Enums.WorkLogStatus.INIT_INSPECTION,
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
}
