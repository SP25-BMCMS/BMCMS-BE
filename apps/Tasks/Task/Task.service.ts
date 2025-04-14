// task.service.ts
import { Inject, Injectable } from '@nestjs/common'
import { AssignmentStatus, Prisma, Status } from '@prisma/client-Task'
import { ClientGrpc, ClientProxy, RpcException } from '@nestjs/microservices'
import { CreateTaskDto } from '../../../libs/contracts/src/tasks/create-Task.dto'
import { UpdateTaskDto } from '../../../libs/contracts/src/tasks/update.Task'
import { ChangeTaskStatusDto } from '../../../libs/contracts/src/tasks/ChangeTaskStatus.Dto '
import {
  PaginationParams,
  PaginationResponseDto,
} from 'libs/contracts/src/Pagination/pagination.dto'
import { ApiResponse } from '../../../libs/contracts/src/ApiResponse/api-response'
import { PrismaService } from '../prisma/prisma.service'
import { firstValueFrom, Observable, of, throwError } from 'rxjs'
import { TaskAssignmentsService } from '../TaskAssignments/TaskAssignments.service'
import { SCHEDULEJOB_PATTERN } from '@app/contracts/schedulesjob/ScheduleJob.patterns'
import { catchError, retry, timeout } from 'rxjs/operators'

interface UserService {
  checkStaffAreaMatchWithScheduleJob(data: { staffId: string; scheduleJobId: string }): Observable<{
    isSuccess: boolean
    message: string
    isMatch: boolean
  }>
}
const CRACK_PATTERNS = {
  GET_DETAILS: { cmd: 'get-crack-report-by-id' }
}
@Injectable()
export class TaskService {
  private userService: UserService
  constructor(
    private prisma: PrismaService,
    @Inject('USERS_CLIENT') private readonly usersClient: ClientGrpc,
    @Inject('SCHEDULE_CLIENT') private readonly scheduleClient: ClientProxy,
    @Inject('CRACK_CLIENT') private readonly crackClient: ClientProxy,

    private taskAssignmentService: TaskAssignmentsService
  ) {
    this.userService = this.usersClient.getService<UserService>('UserService')
  }

  // Helper để gọi crackClient với retry và timeout
  private async callCrackService(pattern: any, data: any) {
    try {
      return await firstValueFrom(
        this.crackClient.send(pattern, data).pipe(
          timeout(5000), // Tăng timeout lên 5 giây
          retry(2),      // Thử lại 2 lần nếu thất bại
          catchError(err => {
            console.error(`Error calling crack service with pattern ${JSON.stringify(pattern)}: `, err)
            return throwError(() => err)
          })
        )
      )
    } catch (error) {
      console.error(`Failed to get response from crack service after retries: `, error)
      throw error
    }
  }

  async createTask(createTaskDto: CreateTaskDto) {
    try {
      const newTask = await this.prisma.task.create({
        data: {
          description: createTaskDto.description,
          status: createTaskDto.status,
          crack_id: createTaskDto.crack_id,
          schedule_job_id: createTaskDto.schedule_job_id,
        },
      })
      return {
        statusCode: 201,
        message: 'Task created successfully',
        data: newTask,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task creation failed',
      })
    }
  }

  async updateTask(task_id: string, updateTaskDto: UpdateTaskDto) {
    try {
      const updatedTask = await this.prisma.task.update({
        where: { task_id },
        data: {
          description: updateTaskDto.description,
          status: updateTaskDto.status,
          crack_id: updateTaskDto.crack_id,
          schedule_job_id: updateTaskDto.schedule_job_id,
        },
      })
      return {
        statusCode: 200,
        message: 'Task updated successfully',
        data: updatedTask,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task update failed',
      })
    }
  }

  async getTaskById(task_id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { task_id },
      })
      if (!task) {
        return {
          statusCode: 404,
          message: 'Task not found',
        }
      }

      const result = { task }

      // If crack_id exists, get crack info
      if (task.crack_id) {

        try {
          console.log("🚀 ~ TaskService ~ getTaskById ~ task.crack_id:", task.crack_id)
          const crackInfo = await firstValueFrom(
            this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
          )
          result['crackInfo'] = crackInfo
        } catch (error) {
          task['crackInfo'] = {
            statusCode: 400,
            message: 'No crackReport find á',
            data: null,
          }
        }


      }

      return {
        statusCode: 200,
        message: 'Task retrieved successfully',
        data: result,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving task',
      })
    }
  }

  async deleteTask(task_id: string) {
    try {
      const deletedTask = await this.prisma.task.update({
        where: { task_id },
        data: { status: 'Completed' }, // Mark the task as completed when deleted
      })
      return {
        statusCode: 200,
        message: 'Task deleted successfully',
        data: deletedTask,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task deletion failed',
      })
    }
  }

  // async changeTaskStatus(task_id: string, changeTaskStatusDto: ChangeTaskStatusDto) {
  //   try {
  //     const updatedTask = await this.prisma.task.update({
  //       where: { task_id },
  //       data: {
  //         status: changeTaskStatusDto.status,
  //       },
  //     });
  //     return {
  //       statusCode: 200,
  //       message: 'Task status updated successfully',
  //       data: updatedTask,
  //     };
  //   } catch (error) {
  //     console.error("Error updating task status:", error);  // Lo
  //     throw new RpcException({
  //       statusCode: 400,
  //       message: 'Error updating task status',
  //     });
  //   }
  // }
  async changeTaskStatus(task_id: string, changeTaskStatusDto: string) {
    console.log('🚀 ~ TaskService ~ changeTaskStatus ~ task_id:', task_id)
    try {
      console.log('🚀 ~ TaskService ~ changeTaskStatus ~ task_id:', task_id)
      console.log(
        '🚀 ~ TaskService ~ changeTaskStatus ~ changeTaskStatusDto:',
        changeTaskStatusDto,
      )

      // Check if the task exists before trying to update
      const task = await this.prisma.task.findUnique({
        where: { task_id },
      })

      // If task does not exist, throw an exception
      if (!task) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task not found',
        })
      }
      const status: Status = changeTaskStatusDto as Status // This assumes changeTaskStatusDto is a valid status string

      // Proceed to update the status
      const updatedTask = await this.prisma.task.update({
        where: { task_id },
        data: {
          status: status,
        },
      })

      return {
        statusCode: 200,
        message: 'Task status updated successfully',
        data: updatedTask,
      }
    } catch (error) {
      console.error('Error updating task status:', error) // Log error details for debugging

      // Return a meaningful response for the error
      throw new RpcException({
        statusCode: 400,
        message: 'Error updating task status',
        error: error.message, // Include the error message for debugging
      })
    }
  }

  async getAllTasks(paginationParams?: PaginationParams) {
    const startTime = performance.now()
    try {
      // Default values if not provided
      const page = Math.max(1, paginationParams?.page || 1)
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10))
      const statusFilter = paginationParams?.statusFilter

      // Calculate skip value for pagination
      const skip = (page - 1) * limit

      // Build where clause for filtering
      const whereClause = statusFilter ? { status: statusFilter as Status } : {}

      // Get paginated data with caching
      const [tasks, total] = await Promise.all([
        this.prisma.task.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            taskAssignments: true,
            workLogs: true,
            feedbacks: true
          }
        }),
        this.prisma.task.count({
          where: whereClause,
        }),
      ])

      const dbQueryTime = performance.now() - startTime
      console.log(`Database query time: ${dbQueryTime.toFixed(2)}ms`)

      // Fetch crack info in parallel with a reasonable timeout
      const crackInfoPromises = tasks.map(task => {
        if (!task.crack_id) return Promise.resolve(null)

        return firstValueFrom(
          this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id).pipe(
            timeout(10000), // Reduced timeout to 10 seconds
            catchError(err => {
              console.error(`Error fetching crack info for task ${task.task_id}:`, err)
              return of({
                statusCode: 400,
                message: 'No crackReport found',
                data: null,
              })
            })
          )
        )
      })

      const crackInfoStartTime = performance.now()
      const crackInfos = await Promise.all(crackInfoPromises)
      const crackInfoTime = performance.now() - crackInfoStartTime
      console.log(`Crack info fetch time: ${crackInfoTime.toFixed(2)}ms`)

      // Attach crack info to tasks
      tasks.forEach((task, index) => {
        task['crackInfo'] = crackInfos[index]
      })

      const totalTime = performance.now() - startTime
      console.log(`Total execution time: ${totalTime.toFixed(2)}ms`)

      return new PaginationResponseDto(
        tasks,
        total,
        page,
        limit,
        200,
        tasks.length > 0 ? 'Tasks retrieved successfully' : 'No tasks found',
      )
    } catch (error) {
      console.error('Error retrieving tasks:', error)
      throw new RpcException({
        statusCode: 500,
        message: `Error retrieving tasks: ${error.message}`,
      })
    }
  }

  async getTasksByStatus(status: Status) {
    try {
      const tasks = await this.prisma.task.findMany({
        where: { status },
      })

      // Thêm thông tin crack vào các task (nếu có)
      for (const task of tasks) {
        if (task.crack_id) {
          try {
            const crackInfo = await firstValueFrom(
              this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
            )
            // Thêm crackInfo vào task
            task['crackInfo'] = crackInfo
          } catch (err) {
            console.error(`Error fetching crack info for task ${task.task_id}:`, err)
            // Tiếp tục với task tiếp theo
          }
        }
      }

      return {
        statusCode: 200,
        message: 'Tasks by status fetched successfully',
        data: tasks,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving tasks by status',
      })
    }
  }

  /**
   * Get crack_id from task_id
   * Used by other microservices to resolve relationships
   */
  async getCrackIdByTask(taskId: string): Promise<ApiResponse<any>> {
    try {
      console.log(`Looking for task with ID: ${taskId}`)

      const task = await this.prisma.task.findUnique({
        where: { task_id: taskId }
      })

      if (!task) {
        console.log(`No task found with ID ${taskId}`)
        return new ApiResponse(false, 'Task not found', null)
      }

      console.log('Found task:', JSON.stringify(task, null, 2))

      return new ApiResponse(true, 'Crack ID retrieved successfully', {
        crackReportId: task.crack_id
      })
    } catch (error) {
      console.error(`Error retrieving crack ID for task ${taskId}:`, error)
      return new ApiResponse(false, 'Error retrieving crack ID', null)
    }
  }

  async createTaskForScheduleJob(scheduleJobId: string, staffId: string) {
    try {

      // Validate input parameters
      if (!scheduleJobId || !staffId) {
        throw new RpcException(
          new ApiResponse(false, 'scheduleJobId và staffId là bắt buộc')
        )
      }


      // Define all variables outside the transaction to maintain scope
      let existingScheduleJob
      let areaMatchResponse
      let createTaskResponse
      let createTaskAssignmentResponse

      // Start a real database transaction - all operations will be committed or rolled back together
      return await this.prisma.$transaction(async (prisma) => {
        // Step 1: Find the scheduleJob and validate it exists
        // Gọi đến schedules service để kiểm tra scheduleJob có tồn tại không
        console.log('Sending request to schedule service with pattern:', SCHEDULEJOB_PATTERN.GET_BY_ID, 'and payload:', { schedule_job_id: scheduleJobId })

        try {
          existingScheduleJob = await firstValueFrom(
            this.scheduleClient.send(
              SCHEDULEJOB_PATTERN.GET_BY_ID,
              { schedule_job_id: scheduleJobId }
            ).pipe(
              // Add a timeout to avoid hanging indefinitely
              timeout(10000)
            )
          )

        } catch (err) {
          throw new RpcException({
            statusCode: 404,
            message: `Không tìm thấy lịch công việc với ID: ${scheduleJobId}`
          })
        }

        if (!existingScheduleJob || !existingScheduleJob.isSuccess) {
          console.error('Schedule job not found or invalid response:', existingScheduleJob)
          throw new RpcException({
            statusCode: 404,
            message: `Không tìm thấy lịch công việc với ID: ${scheduleJobId}`
          })
        }

        console.log('Schedule job found:', existingScheduleJob)

        // Step 2: Check if staff's area matches the crack report's area
        console.log('Checking staff area match with scheduleJobId')
        try {
          areaMatchResponse = await firstValueFrom(
            this.userService.checkStaffAreaMatchWithScheduleJob({ staffId, scheduleJobId })
          )
          console.log('Area match response:', areaMatchResponse)
        } catch (err) {
          console.error('Error checking staff area match:', err)
          throw new RpcException(
            new ApiResponse(false, `Lỗi khi kiểm tra khu vực nhân viên: ${err.message}`)
          )
        }

        // Kiểm tra lại chi tiết về response từ areaMatch
        console.log('Complete area match response:', JSON.stringify(areaMatchResponse))

        if (!areaMatchResponse) {
          console.log('No response from area match check')
          throw new RpcException({
            statusCode: 500,
            message: 'Không nhận được phản hồi khi kiểm tra khu vực nhân viên'
          })
        }

        // Nếu statusCode được trả về từ microservice, sử dụng nó
        if (areaMatchResponse.statusCode) {
          console.log(`Using explicit statusCode from microservice: ${areaMatchResponse.statusCode}`)
          throw new RpcException({
            statusCode: areaMatchResponse.statusCode,
            message: areaMatchResponse.message || 'Lỗi không xác định'
          })
        }

        if (!areaMatchResponse.isSuccess) {
          console.log('Area match check unsuccessful:', areaMatchResponse.message)

          // Kiểm tra nội dung lỗi để quyết định statusCode
          if (areaMatchResponse.message && (
            areaMatchResponse.message.includes('không tìm thấy') ||
            areaMatchResponse.message.includes('Không tìm thấy')
          )) {
            throw new RpcException({
              statusCode: 404,
              message: areaMatchResponse.message
            })
          } else {
            throw new RpcException({
              statusCode: 400,
              message: areaMatchResponse.message || 'Lỗi khi kiểm tra khu vực nhân viên'
            })
          }
        }

        if (!areaMatchResponse.isMatch) {
          console.log('Staff area does not match with schedule job area. Details:', areaMatchResponse.message)
          throw new RpcException({
            statusCode: 400,
            message: areaMatchResponse.message || 'Nhân viên không thuộc khu vực của công việc này'
          })
        }

        // Check for unconfirmed tasks
        console.log('Checking unconfirmed tasks for staff:', staffId)
        const unconfirmedTasks = await this.prisma.taskAssignment.findMany({
          where: {
            employee_id: staffId,
            status: {
              notIn: [AssignmentStatus.Confirmed]
            }
          }
        })
        console.log('Unconfirmed tasks count:', unconfirmedTasks.length)

        if (unconfirmedTasks.length > 0) {
          console.log('Staff has unconfirmed tasks, cannot assign new task')
          return {
            statusCode: 400,
            message: 'Staff has unconfirmed tasks. Cannot assign new task.',
            data: null
          }
        }

        // Step 3: Create task first - do this before updating report status
        console.log('Creating new task for schedule job')

        // Kiểm tra status từ enum
        console.log('Available Status enum values:', Object.values(Status))

        try {
          createTaskResponse = await this.createTask({
            description: `Phân công sửa chữa vết nứt định kỳ`,
            status: Status.Assigned, // Sử dụng string "Assigned" thay vì enum Status.Assigned
            crack_id: "",
            schedule_job_id: scheduleJobId,
          })
          console.log('Create task response:', createTaskResponse)
        } catch (taskError) {
          console.error('Failed to create task:', taskError)
          throw new RpcException(
            new ApiResponse(false, `Lỗi khi tạo task: ${taskError.message}`)
          )
        }

        // Check if task creation was successful and task_id exists
        if (!createTaskResponse?.data?.task_id) {
          console.error('Task created but no task_id returned:', createTaskResponse)
          throw new RpcException(
            new ApiResponse(false, 'Task được tạo nhưng không trả về task_id hợp lệ')
          )
        }

        // Step 4: Create task assignment
        console.log('Assigning task to employee:', staffId)
        createTaskAssignmentResponse = await this.taskAssignmentService.assignTaskToEmployee(
          createTaskResponse.data.task_id,
          staffId,
          `Phân công xử lý báo cáo nứt định kỳ`
        )
        console.log('Task assignment response:', createTaskAssignmentResponse)

        // Check task assignment response
        if (createTaskAssignmentResponse?.statusCode === 400) {
          console.error('Error assigning task:', createTaskAssignmentResponse)
          throw new RpcException(
            new ApiResponse(false, createTaskAssignmentResponse.message || 'Lỗi phân công task')
          )
        }

        // Return success response with all data
        console.log('Transaction completed successfully')
        return new ApiResponse(
          true,
          'Task đã được tạo',
          {
            task: createTaskResponse,
            taskAssignment: createTaskAssignmentResponse,
          }
        )
      }, {
        // Set a long timeout for the transaction since we're making external calls
        timeout: 30000,
        // Use serializable isolation level for maximum consistency
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      })
    } catch (error) {
      console.error('🔥 Lỗi trong createTaskForScheduleJob:', error)

      // Pass through RpcExceptions
      if (error instanceof RpcException) {
        throw error
      }

      // Wrap other errors
      throw new RpcException(
        new ApiResponse(false, `Lỗi hệ thống: ${error.message}`)
      )
    }
  }
}
