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
import { AREAS_PATTERN } from '@app/contracts/Areas/Areas.patterns'
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns'
import { BUILDINGDETAIL_PATTERN } from '@app/contracts/BuildingDetails/buildingdetails.patterns'
import { GetTasksByTypeDto } from '@app/contracts/tasks/get-tasks-by-type.dto'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { NotificationType } from '@app/contracts/notifications/notification.dto'

const CRACK_PATTERNS = {
  GET_DETAILS: { cmd: 'get-crack-report-by-id' }
}

interface UserService {
  checkStaffAreaMatchWithScheduleJob(data: { staffId: string; scheduleJobId: string }): Observable<{
    isSuccess: boolean
    message: string
    isMatch: boolean
  }>

  // Thêm phương thức hiện có trong UserService
  getAllStaff(data: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string[];
  }): Observable<{
    isSuccess: boolean;
    message: string;
    data: any[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }>;

  // Thêm phương thức hiện có
  checkUserExists(data: { userId: string; role?: string }): Observable<{
    exists: boolean;
    message: string;
    data?: { userId: string; role: string } | null;
  }>;

  // Thêm phương thức để lấy thông tin người dùng
  getUserById(data: { userId: string }): Observable<{
    userId: string;
    username: string;
    email: string;
    phone: string;
    role: string;
    roleLabel: string;
    dateOfBirth: string;
    gender: string;
    genderLabel: string;
    userDetails: any;
    apartments: any[];
    accountStatus: string;
    accountStatusLabel: string;
  }>;
}

interface AreaManagerResponse {
  isSuccess: boolean;
  message: string;
  data?: {
    userId: string;
    name?: string;
    [key: string]: any;
  };
}

interface BuildingResponse {
  isSuccess?: boolean;
  data?: {
    name: string;
    [key: string]: any;
  };
}

@Injectable()
export class TaskService {
  private userService: UserService
  constructor(
    private prisma: PrismaService,
    @Inject('USERS_CLIENT') private readonly usersClient: ClientGrpc,
    @Inject('SCHEDULE_CLIENT') private readonly scheduleClient: ClientProxy,
    @Inject('CRACK_CLIENT') private readonly crackClient: ClientProxy,
    @Inject('BUILDINGS_CLIENT') private readonly buildingsClient: ClientProxy,
    private taskAssignmentService: TaskAssignmentsService,
    @Inject('NOTIFICATION_CLIENT') private readonly notificationsClient: ClientProxy
  ) {
    this.userService = this.usersClient.getService<UserService>('UserService')
    console.log('TaskService initialized with all clients')

    // Add debug info for clients
    this.scheduleClient.connect().catch(err => console.error('Error connecting to schedule service:', err));
    this.buildingsClient.connect().catch(err => console.error('Error connecting to buildings service:', err));
    this.notificationsClient.connect().catch(err => console.error('Error connecting to notifications service:', err));
  }

  // Improve helper method to handle timeouts better
  private async callCrackService(pattern: any, data: any) {
    try {
      console.log(`[TaskService] Calling crack service with pattern ${JSON.stringify(pattern)} and data:`, typeof data === 'string' ? data : JSON.stringify(data));
      return await firstValueFrom(
        this.crackClient.send(pattern, data).pipe(
          timeout(10000), // Increase timeout to 10 seconds
          retry(3),      // Retry 3 times
          catchError(err => {
            console.error(`Error calling crack service with pattern ${JSON.stringify(pattern)}: `, err);
            // Return a minimal response instead of throwing an error
            return of({
              isSuccess: false,
              message: `Error retrieving data from crack service: ${err.message}`,
              data: null
            });
          })
        )
      );
    } catch (error) {
      console.error(`Failed to get response from crack service after retries: `, error);
      // Return a minimal response instead of throwing an error
      return {
        isSuccess: false,
        message: `Failed to communicate with crack service: ${error.message}`,
        data: null
      };
    }
  }

  async createTask(createTaskDto: CreateTaskDto) {
    try {
      const newTask = await this.prisma.task.create({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          status: createTaskDto.status,
          crack_id: createTaskDto.crack_id,
          schedule_job_id: createTaskDto.schedule_job_id,
        },
      })
      return {
        statusCode: 201,
        message: 'Nhiệm vụ đã được tạo thành công',
        data: newTask,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Không thể tạo nhiệm vụ',
      })
    }
  }

  async updateTask(task_id: string, updateTaskDto: UpdateTaskDto) {
    try {
      const updatedTask = await this.prisma.task.update({
        where: { task_id },
        data: {
          title: updateTaskDto.title,
          description: updateTaskDto.description,
          status: updateTaskDto.status,
          crack_id: updateTaskDto.crack_id,
          schedule_job_id: updateTaskDto.schedule_job_id,
        },
      })
      return {
        statusCode: 200,
        message: 'Nhiệm vụ đã được cập nhật thành công',
        data: updatedTask,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Không thể cập nhật nhiệm vụ',
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
          message: 'Không tìm thấy nhiệm vụ',
        }
      }

      const result = { task }

      // Fetch both crack info and schedule job info if they exist
      const promises = [];

      if (task.crack_id) {
        promises.push(
          firstValueFrom(
            this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id).pipe(
              timeout(15000),
              catchError(err => {
                console.error(`Error fetching crack info for task ${task.task_id}:`, err)
                return of({
                  statusCode: 400,
                  message: 'Không tìm thấy báo cáo vết nứt',
                  data: null,
                })
              })
            )
          ).then(response => ({ type: 'crack', data: response }))
        );
      }

      if (task.schedule_job_id) {
        promises.push(
          firstValueFrom(
            this.scheduleClient.send(SCHEDULEJOB_PATTERN.GET_BY_ID, { schedule_job_id: task.schedule_job_id }).pipe(
              timeout(15000),
              catchError(err => {
                console.error(`Error fetching schedule job info for task ${task.task_id}:`, err)
                return of({
                  statusCode: 400,
                  message: 'Không tìm thấy lịch trình',
                  data: null,
                })
              })
            )
          ).then(response => ({ type: 'scheduleJob', data: response }))
        );
      }

      // Wait for all promises to resolve
      const infos = await Promise.all(promises);

      // Attach all available info to the result
      infos.forEach(info => {
        if (info?.type === 'crack') {
          result['crackInfo'] = info.data;
        }
        if (info?.type === 'scheduleJob') {
          result['schedulesjobInfo'] = info.data;
        }
      });

      return {
        statusCode: 200,
        message: 'Lấy thông tin nhiệm vụ thành công',
        data: result,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy thông tin nhiệm vụ',
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
        message: 'Nhiệm vụ đã được xóa thành công',
        data: deletedTask,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Không thể xóa nhiệm vụ',
      })
    }
  }

  async deleteTaskAndRelated(task_id: string) {
    try {
      // Check if task exists
      const task = await this.prisma.task.findUnique({
        where: { task_id },
        include: {
          taskAssignments: {
            include: {
              inspections: {
                include: {
                  repairMaterials: true
                }
              }
            }
          },
          workLogs: true,
          feedbacks: true
        }
      });

      if (!task) {
        return new ApiResponse(false, `Không tìm thấy nhiệm vụ với ID ${task_id}`, null);
      }

      console.log(`[TaskService] Deleting task ${task_id} with ${task.taskAssignments.length} assignments, ${task.workLogs.length} work logs, and ${task.feedbacks.length} feedbacks`);

      // Use a transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx) => {
        // Track statistics for what we've deleted
        let inspectionCount = 0;
        let repairMaterialCount = 0;

        // First handle all the dependencies in the correct order
        if (task.taskAssignments.length > 0) {
          // 1. First, get all inspection IDs
          const inspections = task.taskAssignments.flatMap(assignment => assignment.inspections || []);
          inspectionCount = inspections.length;

          if (inspectionCount > 0) {
            console.log(`[TaskService] Found ${inspectionCount} inspection records related to task assignments`);

            // 2. Delete all repair materials first
            for (const inspection of inspections) {
              if (inspection.repairMaterials && inspection.repairMaterials.length > 0) {
                await tx.repairMaterial.deleteMany({
                  where: {
                    inspection_id: inspection.inspection_id
                  }
                });
                repairMaterialCount += inspection.repairMaterials.length;
              }
            }
            console.log(`[TaskService] Deleted ${repairMaterialCount} repair materials`);

            // 3. Now delete all inspections
            const inspectionIds = inspections.map(insp => insp.inspection_id);
            await tx.inspection.deleteMany({
              where: {
                inspection_id: {
                  in: inspectionIds
                }
              }
            });
            console.log(`[TaskService] Deleted ${inspectionCount} inspection records`);
          }

          // 4. Delete all task assignments
          await tx.taskAssignment.deleteMany({
            where: { task_id }
          });
          console.log(`[TaskService] Deleted ${task.taskAssignments.length} task assignments`);
        }

        // 5. Delete all WorkLogs related to this task
        if (task.workLogs.length > 0) {
          await tx.workLog.deleteMany({
            where: { task_id }
          });
          console.log(`[TaskService] Deleted ${task.workLogs.length} work logs`);
        }

        // 6. Delete all Feedbacks related to this task
        if (task.feedbacks.length > 0) {
          await tx.feedback.deleteMany({
            where: { task_id }
          });
          console.log(`[TaskService] Deleted ${task.feedbacks.length} feedbacks`);
        }

        // 7. Finally delete the Task itself
        const deletedTask = await tx.task.delete({
          where: { task_id }
        });
        console.log(`[TaskService] Deleted task ${task_id}`);

        // 8. Handle related entities in other services if needed
        let crackUpdated = false;
        let scheduleJobUpdated = false;

        // 8a. If task has a crack_id, update the crack report status
        if (task.crack_id) {
          try {
            console.log(`[TaskService] Attempting to update crack report ${task.crack_id} status to Pending`);

            const crackUpdateResponse = await this.callCrackService(
              { cmd: 'update-crack-report-for-all-status' },
              {
                crackReportId: task.crack_id,
                dto: {
                  status: 'Pending',
                  suppressNotification: true
                }
              }
            );

            if (crackUpdateResponse && crackUpdateResponse.isSuccess) {
              crackUpdated = true;
              console.log(`[TaskService] Updated crack report ${task.crack_id} status to Pending`);
            }
          } catch (error) {
            console.error(`[TaskService] Error updating crack report status: ${error.message}`);
            // Continue even if this fails
          }
        }

        // 8b. If task has a schedule_job_id, update the schedule job status
        if (task.schedule_job_id) {
          try {
            console.log(`[TaskService] Attempting to update schedule job ${task.schedule_job_id} status to Pending`);

            const scheduleUpdateResponse = await firstValueFrom(
              this.scheduleClient.send(
                SCHEDULEJOB_PATTERN.UPDATE_STATUS,
                {
                  schedulejobs_id: task.schedule_job_id,
                  status: 'Pending'
                }
              ).pipe(
                timeout(10000),
                catchError(err => {
                  console.error(`[TaskService] Error updating schedule job status: ${err.message}`);
                  return of({ isSuccess: false });
                })
              )
            );

            if (scheduleUpdateResponse && scheduleUpdateResponse.isSuccess) {
              scheduleJobUpdated = true;
              console.log(`[TaskService] Updated schedule job ${task.schedule_job_id} status to Pending`);
            }
          } catch (error) {
            console.error(`[TaskService] Error updating schedule job status: ${error.message}`);
            // Continue even if this fails
          }
        }

        return new ApiResponse(true, 'Nhiệm vụ và tất cả dữ liệu liên quan đã được xóa thành công', {
          task: deletedTask,
          relatedData: {
            inspections: inspectionCount,
            repairMaterials: repairMaterialCount,
            taskAssignments: task.taskAssignments.length,
            workLogs: task.workLogs.length,
            feedbacks: task.feedbacks.length,
            crackReportUpdated: crackUpdated,
            scheduleJobUpdated: scheduleJobUpdated
          }
        });
      }, {
        timeout: 30000, // 30 second timeout
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
      });
    } catch (error) {
      console.error(`[TaskService] Error during task deletion: ${error.message}`, error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Check for specific Prisma errors
        if (error.code === 'P2025') {
          return new ApiResponse(false, 'Không tìm thấy nhiệm vụ để xóa', null);
        }
        if (error.code === 'P2023') {
          return new ApiResponse(false, 'Định dạng ID không hợp lệ', null);
        }
        if (error.code === 'P2003') {
          // Extract the constraint name from the error message
          const constraintMatch = error.message.match(/`([^`]+)`/g);
          const constraintName = constraintMatch ? constraintMatch[constraintMatch.length - 1] : 'unknown constraint';
          return new ApiResponse(false, `Không thể xóa do ràng buộc khóa ngoại: ${constraintName}. Cần xóa các bản ghi tham chiếu trước.`, null);
        }
      }

      throw new RpcException({
        statusCode: 500,
        message: `Xóa nhiệm vụ thất bại: ${error.message}`
      });
    }
  }

  // async changeTaskStatus(task_id: string, changeTaskStatusDto: ChangeTaskStatusDto) {
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
          message: 'Không tìm thấy nhiệm vụ',
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
        message: 'Cập nhật trạng thái nhiệm vụ thành công',
        data: updatedTask,
      }
    } catch (error) {
      console.error('Error updating task status:', error) // Log error details for debugging

      // Return a meaningful response for the error
      throw new RpcException({
        statusCode: 400,
        message: 'Lỗi khi cập nhật trạng thái nhiệm vụ',
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

      // Fetch both crack info and schedule job info for each task
      const additionalInfoPromises = tasks.map(task => {
        const promises = [];

        if (task.crack_id) {
          promises.push(
            firstValueFrom(
              this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id).pipe(
                timeout(15000),
                catchError(err => {
                  console.error(`Error fetching crack info for task ${task.task_id}:`, err)
                  return of({
                    statusCode: 400,
                    message: 'Không tìm thấy báo cáo vết nứt',
                    data: null,
                  })
                })
              )
            ).then(response => ({ type: 'crack', data: response }))
          );
        }

        if (task.schedule_job_id) {
          promises.push(
            firstValueFrom(
              this.scheduleClient.send(SCHEDULEJOB_PATTERN.GET_BY_ID, { schedule_job_id: task.schedule_job_id }).pipe(
                timeout(15000),
                catchError(err => {
                  console.error(`Error fetching schedule job info for task ${task.task_id}:`, err)
                  return of({
                    statusCode: 400,
                    message: 'Không tìm thấy lịch trình',
                    data: null,
                  })
                })
              )
            ).then(response => ({ type: 'scheduleJob', data: response }))
          );
        }

        return Promise.all(promises);
      })

      const additionalInfoStartTime = performance.now()
      const additionalInfos = await Promise.all(additionalInfoPromises)
      const additionalInfoTime = performance.now() - additionalInfoStartTime
      console.log(`Additional info fetch time: ${additionalInfoTime.toFixed(2)}ms`)

      // Attach all available info to tasks
      tasks.forEach((task, index) => {
        const infos = additionalInfos[index];
        infos.forEach(info => {
          if (info?.type === 'crack') {
            task['crackInfo'] = info.data;
          }
          if (info?.type === 'scheduleJob') {
            task['schedulesjobInfo'] = info.data;
          }
        });
      })

      const totalTime = performance.now() - startTime
      console.log(`Total execution time: ${totalTime.toFixed(2)}ms`)

      return new PaginationResponseDto(
        tasks,
        total,
        page,
        limit,
        200,
        tasks.length > 0 ? 'Lấy danh sách nhiệm vụ thành công' : 'Không tìm thấy nhiệm vụ nào',
      )
    } catch (error) {
      console.error('Error retrieving tasks:', error)
      throw new RpcException({
        statusCode: 500,
        message: `Lỗi khi lấy danh sách nhiệm vụ: ${error.message}`,
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
        message: 'Lấy danh sách nhiệm vụ theo trạng thái thành công',
        data: tasks,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách nhiệm vụ theo trạng thái',
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
        return new ApiResponse(false, 'Không tìm thấy nhiệm vụ', null)
      }

      console.log('Found task:', JSON.stringify(task, null, 2))

      return new ApiResponse(true, 'Lấy ID vết nứt thành công', {
        crackReportId: task.crack_id
      })
    } catch (error) {
      console.error(`Error retrieving crack ID for task ${taskId}:`, error)
      return new ApiResponse(false, 'Lỗi khi lấy ID vết nứt', null)
    }
  }

  async createTaskForScheduleJob(scheduleJobId: string, staffId?: string) {
    try {
      // Validate input
      if (!scheduleJobId) {
        throw new RpcException(
          new ApiResponse(false, 'Yêu cầu scheduleJobId')
        );
      }

      console.log('Starting task creation for schedule job:', scheduleJobId);

      // Kiểm tra xem task đã được tạo cho scheduleJob này chưa
      const existingTask = await this.prisma.task.findFirst({
        where: { schedule_job_id: scheduleJobId }
      });

      // Nếu task đã tồn tại, trả về luôn
      if (existingTask) {
        console.log(`Task already exists for this schedule job ${scheduleJobId}, lấy assignment hiện có`);

        const existingAssignment = await this.prisma.taskAssignment.findFirst({
          where: { task_id: existingTask.task_id }
        });

        return new ApiResponse(
          true,
          'Nhiệm vụ đã tồn tại cho lịch trình này',
          {
            task: existingTask,
            taskAssignment: existingAssignment ? {
              statusCode: 200,
              message: 'Phân công đã tồn tại',
              data: existingAssignment
            } : null,
            staffLeader: existingAssignment ? {
              staffId: existingAssignment.employee_id
            } : null
          }
        );
      }

      // Biến để lưu trữ dữ liệu
      let matchedStaffId = staffId; // Sử dụng staffId được cung cấp (nếu có)
      let buildingDetailId: string = null;
      let buildingName: string = "Tòa nhà không xác định";
      let buildingAreaName: string = null;

      // Sử dụng transaction để đảm bảo toàn vẹn dữ liệu
      return await this.prisma.$transaction(async (prisma) => {
        // BƯỚC 1: Lấy thông tin scheduleJob để tìm buildingId
        console.log('Fetching schedule job data:', scheduleJobId);

        // Lưu trữ ID cần truy vấn
        const scheduleJobQuery = { schedule_job_id: scheduleJobId };
        console.log('paypayloadpayloadpayloadpayloadpayloadpayloadpayloadload', scheduleJobId);
        console.log('schedule_job_idschedule_job_idschedule_job_idschedule_job_idschedule_job_idschedule_job_idschedule_job_id', scheduleJobId);

        const scheduleJobResponse = await firstValueFrom(
          this.scheduleClient.send(SCHEDULEJOB_PATTERN.GET_BY_ID, scheduleJobQuery)
            .pipe(
              timeout(10000), // Tăng timeout lên 10 giây
              catchError(err => {
                console.error('Error fetching schedule job:', err);

                // Thử sửa lại cấu trúc payload
                const alternativePayload = { scheduleJobId: scheduleJobId };
                return this.scheduleClient.send('get_ScheduleJob_by_id', alternativePayload).pipe(
                  timeout(10000),
                  catchError(err2 => {
                    console.error('Alternative pattern with different payload structure failed:', err2);

                    // Thử pattern thay thế
                    return this.scheduleClient.send('get_schedulejob_by_id', alternativePayload).pipe(
                      timeout(10000),
                      catchError(err3 => {
                        console.error('All patterns failed:', err3);
                        return throwError(() => new RpcException({
                          statusCode: 404,
                          message: `Không tìm thấy lịch trình: ${err.message}`
                        }));
                      })
                    );
                  })
                );
              })
            )
        );

        if (!scheduleJobResponse?.isSuccess && !scheduleJobResponse?.data) {
          console.error('Invalid schedule job response:', JSON.stringify(scheduleJobResponse));
          throw new RpcException({
            statusCode: 404,
            message: 'Không tìm thấy lịch trình hoặc định dạng dữ liệu không hợp lệ'
          });
        }

        // Kiểm tra dữ liệu trả về trong các định dạng khác nhau
        const scheduleJobData = scheduleJobResponse.data || scheduleJobResponse;

        // Lấy buildingDetailId từ scheduleJob - kiểm tra nhiều trường hợp khác nhau
        buildingDetailId = scheduleJobData.buildingDetailId ||
          scheduleJobData.building_id ||
          scheduleJobResponse.buildingDetailId ||
          scheduleJobResponse.building_id ||
          null;

        console.log('Building ID from schedule job:', buildingDetailId);

        if (!buildingDetailId) {
          throw new RpcException({
            statusCode: 400,
            message: 'Lịch trình không có thông tin tòa nhà'
          });
        }

        // BƯỚC 2: Lấy thông tin building để tìm area
        console.log('Fetching building info for ID:', buildingDetailId);
        const buildingDetailResponse = await firstValueFrom(
          this.buildingsClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
            .pipe(
              timeout(10000),
              catchError(err => {
                console.error('Error fetching building:', err);

                // Thử các cách gọi khác
                const alternativePayload = { building_detail_id: buildingDetailId };
                return this.buildingsClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, alternativePayload).pipe(
                  timeout(10000),
                  catchError(err2 => {
                    console.error('Alternative payload structure failed:', err2);

                    return this.buildingsClient.send('get_building_detail_by_id', { buildingDetailId }).pipe(
                      timeout(10000),
                      catchError(err3 => {
                        console.error('All building service patterns failed:', err3);
                        return throwError(() => new RpcException({
                          statusCode: 404,
                          message: `Không tìm thấy tòa nhà: ${err.message}`
                        }));
                      })
                    );
                  })
                );
              })
            )
        );

        // Kiểm tra dữ liệu trả về từ building service
        console.log('Building Response:', JSON.stringify(buildingDetailResponse));

        // Xử lý nhiều định dạng dữ liệu có thể nhận được
        const buildingData = buildingDetailResponse?.data || buildingDetailResponse;

        if (!buildingData) {
          throw new RpcException({
            statusCode: 404,
            message: 'Không tìm thấy thông tin tòa nhà'
          });
        }

        // Lấy tên và area của building, kiểm tra nhiều cấu trúc dữ liệu
        buildingName = buildingData.name ||
          buildingData.buildingName ||
          buildingDetailResponse.name ||
          "Tòa nhà không xác định";

        // Trích xuất thông tin khu vực từ nhiều cấu trúc lồng nhau có thể có
        let areaId = null;
        let areaName = null;

        // Tìm kiếm areaId và areaName trong mọi cấu trúc có thể
        if (buildingData.building?.area) {
          areaId = buildingData.building.area.areaId || buildingData.building.area.area_id;
          areaName = buildingData.building.area.name || buildingData.building.area.areaName;
        } else if (buildingData.area) {
          areaId = buildingData.area.areaId || buildingData.area.area_id;
          areaName = buildingData.area.name || buildingData.area.areaName;
        } else if (buildingData.areaId) {
          areaId = buildingData.areaId;
          areaName = buildingData.areaName || "Khu vực không xác định";
        } else if (buildingDetailResponse.areaId) {
          areaId = buildingDetailResponse.areaId;
          areaName = buildingDetailResponse.areaName || "Khu vực không xác định";
        }

        // Sử dụng buildingAreaName từ context hiện tại nếu có
        buildingAreaName = areaName || buildingAreaName;

        console.log(`Found building: ${buildingName}, areaId: ${areaId}, areaName: ${buildingAreaName}`);

        if (!areaId || !buildingAreaName) {
          throw new RpcException({
            statusCode: 404,
            message: 'Tòa nhà không thuộc khu vực nào'
          });
        }

        if (!matchedStaffId && buildingAreaName) {

          try {
            // Lấy tất cả Staff có role = "Staff"
            const staffResponse = await firstValueFrom(
              this.userService.getAllStaff({
                limit: 20,
                role: ['Staff']
              }).pipe(
                timeout(5000),
                catchError(err => {
                  console.error('Error fetching staff list:', err);
                  return of({ isSuccess: false, data: [] });
                })
              )
            );

            if (!staffResponse?.isSuccess || !staffResponse?.data || staffResponse.data.length === 0) {
              throw new RpcException({
                statusCode: 404,
                message: 'Không tìm thấy nhân viên phù hợp'
              });
            }

            const matchingStaff = staffResponse.data.find(staff =>
              staff.userDetails &&
              staff.userDetails.department &&
              staff.userDetails.department.area &&
              staff.userDetails.department.area.toLowerCase() === buildingAreaName.toLowerCase() &&
              staff.userDetails.position &&
              staff.userDetails.position.positionName === 'Leader'
            );

            if (matchingStaff) {
              matchedStaffId = matchingStaff.userId;
            } else {
              throw new RpcException({
                statusCode: 404,
                message: `Không tìm thấy Trưởng nhóm cho khu vực ${buildingAreaName}`
              });
            }
          } catch (error) {
            if (error instanceof RpcException) {
              throw error;
            }
            throw new RpcException({
              statusCode: 500,
              message: `Lỗi khi tìm Trưởng nhóm: ${error.message}`
            });
          }
        }

        if (!matchedStaffId) {
          throw new RpcException({
            statusCode: 404,
            message: 'Không tìm thấy Trưởng nhóm để phân công'
          });
        }

        // BƯỚC 5: Tạo task cho schedule job
        console.log(`Creating task for schedule job ${scheduleJobId} in building ${buildingName}`);

        const taskTitle = `Bảo trì định kỳ cho tòa nhà ${buildingName}`;
        const taskDescription = `Phân công bảo trì định kỳ cho tòa nhà ${buildingName}`;

        const createTaskResponse = await this.createTask({
          title: taskTitle,
          description: taskDescription,
          status: Status.Assigned,
          crack_id: "",
          schedule_job_id: scheduleJobId,
        });

        // Thêm thông tin debug để kiểm tra kết quả tạo task
        console.log(`Task creation response: ${JSON.stringify(createTaskResponse)}`);

        if (!createTaskResponse?.data?.task_id) {
          throw new RpcException(
            new ApiResponse(false, `Lỗi khi tạo nhiệm vụ: ${JSON.stringify(createTaskResponse)}`)
          );
        }

        const taskId = createTaskResponse.data.task_id;
        console.log(`Task created successfully with ID: ${taskId}`);

        // BƯỚC 6: Phân công task cho staff leader
        console.log(`Assigning task ${taskId} to staff leader ${matchedStaffId}`);

        try {
          const taskAssignmentResponse = await this.taskAssignmentService.assignTaskToEmployee(
            taskId,
            matchedStaffId,
            taskDescription
          );

          // Thêm thông tin debug để kiểm tra kết quả phân công
          console.log(`Task assignment response: ${JSON.stringify(taskAssignmentResponse)}`);

          if (taskAssignmentResponse?.statusCode >= 400) {
            console.error(`Error assigning task: ${JSON.stringify(taskAssignmentResponse)}`);
            throw new RpcException(
              new ApiResponse(false, taskAssignmentResponse.message || 'Lỗi khi phân công nhiệm vụ')
            );
          }

          console.log(`Task assigned successfully to staff leader ${matchedStaffId}`);

          // Trả về kết quả thành công
          return new ApiResponse(
            true,
            'Nhiệm vụ đã được tạo và phân công cho Trưởng nhóm thành công',
            {
              task: createTaskResponse.data,
              taskAssignment: taskAssignmentResponse,
              staffLeader: { staffId: matchedStaffId }
            }
          );
        } catch (assignmentError) {
          console.error(`Failed to assign task: ${assignmentError.message}`);

          // Đánh dấu task là unassigned nếu không thể assign
          await this.prisma.task.update({
            where: { task_id: taskId },
            data: { status: Status.Assigned }
          });

          throw new RpcException(
            new ApiResponse(false, `Lỗi khi phân công nhiệm vụ: ${assignmentError.message}`)
          );
        }
      }, {
        timeout: 30000, // Tăng timeout lên 30 giây
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
      });
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException(
        new ApiResponse(false, `Lỗi: ${error.message}`)
      );
    }
  }

  async notificationThankstoResident(taskId: string, scheduleJobId?: string) {
    try {
      console.log(`[TaskService] Processing thanks notification for task: ${taskId}`);

      // Step 1: Verify the task exists
      const task = await this.prisma.task.findUnique({
        where: { task_id: taskId }
      });

      if (!task) {
        throw new RpcException(
          new ApiResponse(false, `Không tìm thấy nhiệm vụ với ID ${taskId}`)
        );
      }

      // Step 2: Check if task has crack_id
      if (!task.crack_id) {
        throw new RpcException(
          new ApiResponse(false, 'Nhiệm vụ không có báo cáo vết nứt liên kết')
        );
      }

      // Initialize default values in case we can't get crack report details
      let residentId = null;
      let crackPosition = "vị trí không xác định";

      // Step 3: Get crack report details via crack microservice
      console.log(`[TaskService] Getting crack report details for ID: ${task.crack_id}`);

      try {
        const crackResponse = await this.callCrackService(
          CRACK_PATTERNS.GET_DETAILS,
          task.crack_id
        );

        if (crackResponse?.isSuccess && crackResponse?.data && crackResponse.data.length > 0) {
          const crackReport = crackResponse.data[0];

          // Extract just the userId as a string, not the full object
          residentId = crackReport.reportedBy;

          // Handle if reportedBy is an object instead of string
          if (typeof residentId === 'object' && residentId !== null) {
            residentId = residentId.userId || residentId.id || null;
          }

          // Get crack position if available
          crackPosition = crackReport.position || "vị trí không xác định";

          console.log(`[TaskService] Successfully retrieved crack report details. Resident ID: ${residentId}, Position: ${crackPosition}`);
        } else {
          console.warn(`[TaskService] Couldn't retrieve crack details but will continue processing: ${crackResponse?.message}`);
        }
      } catch (crackError) {
        console.error('[TaskService] Error getting crack report details but continuing:', crackError);
        // Continue processing even if we can't get crack details
      }

      // If we still don't have a residentId, try to find it from the task's assignments
      if (!residentId) {
        try {
          const taskAssignment = await this.prisma.taskAssignment.findFirst({
            where: { task_id: taskId }
          });

          if (taskAssignment) {
            console.log(`[TaskService] Found task assignment, using employee_id as fallback for resident: ${taskAssignment.employee_id}`);
            residentId = taskAssignment.employee_id;
          }
        } catch (assignmentError) {
          console.error('[TaskService] Error finding task assignment:', assignmentError);
        }
      }

      // If we still don't have a residentId, we can't proceed
      if (!residentId) {
        throw new RpcException(
          new ApiResponse(false, 'Không thể xác định ID cư dân cho thông báo')
        );
      }

      // Step 4: Update task status to Completed
      await this.prisma.task.update({
        where: { task_id: taskId },
        data: { status: Status.Completed }
      });

      console.log(`[TaskService] Updated task ${taskId} status to Completed`);

      // Step 5: Update crack report status to Completed
      // Add suppressNotification flag to prevent automatic notifications from the crack service
      try {
        const crackUpdateResponse = await this.callCrackService(
          { cmd: 'update-crack-report-for-all-status' },
          {
            crackReportId: task.crack_id,
            dto: {
              status: 'Completed',
              suppressNotification: true // Add this flag to prevent automatic notification
            }
          }
        );

        if (crackUpdateResponse.isSuccess) {
          console.log(`[TaskService] Updated crack report status to Completed: ${JSON.stringify(crackUpdateResponse)}`);
        } else {
          console.warn(`[TaskService] Failed to update crack report status but continuing: ${crackUpdateResponse.message}`);
        }
      } catch (crackUpdateError) {
        console.error('[TaskService] Error updating crack report status:', crackUpdateError);
        // Continue with the process even if crack update fails
      }

      // Step 6: Send maintenance email notification if scheduleJobId is provided
      let emailSent = false;
      if (scheduleJobId) {
        try {
          console.log(`[TaskService] Sending maintenance email for scheduleJobId: ${scheduleJobId} to resident: ${residentId}`);

          // Get schedule job details using proper pattern constant
          const scheduleJobResponse = await firstValueFrom(
            this.scheduleClient.send(
              SCHEDULEJOB_PATTERN.GET_BY_ID,
              { schedule_job_id: scheduleJobId }
            ).pipe(
              catchError(error => {
                console.error('[TaskService] Error fetching schedule job details:', error);
                throw new RpcException(
                  new ApiResponse(false, `Không thể lấy thông tin lịch công việc: ${error.message}`)
                );
              })
            )
          );

          if (!scheduleJobResponse || !scheduleJobResponse.isSuccess) {
            console.warn(`[TaskService] Schedule job not found or invalid response`);
            throw new RpcException(
              new ApiResponse(false, 'Không tìm thấy thông tin lịch công việc')
            );
          }

          const scheduleJob = scheduleJobResponse.data;

          // Get building details
          const buildingDetailResponse = await firstValueFrom(
            this.buildingsClient.send(
              BUILDINGDETAIL_PATTERN.GET_BY_ID,
              { buildingDetailId: scheduleJob.buildingDetailId }
            ).pipe(
              catchError(error => {
                console.error('[TaskService] Error fetching building details:', error);
                throw new RpcException(
                  new ApiResponse(false, `Không thể lấy thông tin tòa nhà: ${error.message}`)
                );
              })
            )
          );

          console.log(`[TaskService] Building detail response:`, buildingDetailResponse);

          if (!buildingDetailResponse) {
            console.warn(`[TaskService] Building detail response is null or undefined`);
            throw new RpcException(
              new ApiResponse(false, 'Không nhận được phản hồi từ building service')
            );
          }

          // Kiểm tra cấu trúc phản hồi
          if (!buildingDetailResponse.isSuccess && !buildingDetailResponse.data) {
            console.warn(`[TaskService] Building detail not found or invalid response structure: ${JSON.stringify(buildingDetailResponse)}`);
            throw new RpcException(
              new ApiResponse(false, 'Không tìm thấy thông tin chi tiết tòa nhà hoặc dữ liệu không hợp lệ')
            );
          }

          // Nếu không có isSuccess nhưng có data, coi như thành công
          const buildingDetail = buildingDetailResponse.data || buildingDetailResponse;

          if (!buildingDetail) {
            console.warn(`[TaskService] Building detail data is missing`);
            throw new RpcException(
              new ApiResponse(false, 'Dữ liệu chi tiết tòa nhà bị thiếu')
            );
          }

          // Lấy thông tin cư dân thực sự từ UserService thay vì tạo dữ liệu mẫu
          console.log(`[TaskService] Getting resident information for ID: ${residentId}`);
          const residentResponse = await firstValueFrom(
            this.userService.getUserById({ userId: residentId }).pipe(
              catchError(error => {
                console.error('[TaskService] Error fetching resident details:', error);
                throw new RpcException(
                  new ApiResponse(false, `Không thể lấy thông tin cư dân: ${error.message}`)
                );
              })
            )
          );

          if (!residentResponse) {
            console.warn(`[TaskService] User service returned null or undefined response`);
            throw new RpcException(
              new ApiResponse(false, 'Không nhận được phản hồi từ user service')
            );
          }

          // Debug thông tin người dùng trả về
          console.log(`[TaskService] Got resident info with email: ${residentResponse.email}`);

          // Kiểm tra email có tồn tại không
          if (!residentResponse.email) {
            console.warn(`[TaskService] User ${residentId} has no email address`);
            throw new RpcException(
              new ApiResponse(false, 'Cư dân không có địa chỉ email')
            );
          }

          // Sử dụng thông tin cư dân thực từ UserService
          const resident = {
            userId: residentId,
            email: residentResponse.email,
            username: residentResponse.username,
            name: residentResponse.username,
            apartmentNumber: residentResponse.apartments && residentResponse.apartments.length > 0
              ? residentResponse.apartments[0].apartmentName
              : '101'
          };

          // Get resident's name
          const residentName = resident.username || resident.name || 'Cư dân';

          // Get location details for the resident
          const locationDetails = buildingDetail.locationDetails?.find(
            loc => loc.roomNumber === resident.apartmentNumber
          );

          // Format times for display
          const startTime = scheduleJob.start_date
            ? new Date(scheduleJob.start_date).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            : 'Chưa xác định';

          const endTime = scheduleJob.end_date
            ? new Date(scheduleJob.end_date).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            : 'Chưa xác định';

          const maintenanceDate = scheduleJob.run_date
            ? new Date(scheduleJob.run_date).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            : 'Chưa xác định';

          console.log(`[TaskService] Sending email to resident: ${residentName} (${resident.email}) for maintenance from ${startTime} to ${endTime}`);

          // Prepare email data
          const emailData = {
            to: resident.email,
            residentName: residentName,
            buildingName: buildingDetail.name || buildingDetail.building?.name || 'Chưa xác định',
            maintenanceDate: scheduleJob.run_date,
            startTime: startTime,
            endTime: endTime,
            maintenanceType: scheduleJob.schedule?.schedule_name || 'Bảo trì công trình',
            description: scheduleJob.schedule?.description || 'Không có mô tả chi tiết',
            floor: locationDetails?.floorNumber?.toString() || buildingDetail.numberFloor?.toString() || buildingDetail.building?.numberFloor?.toString() || 'Chưa xác định',
            area: buildingDetail.area?.name || buildingDetail.building?.area?.name || 'Chưa xác định',
            unit: locationDetails?.roomNumber || resident.apartmentNumber || 'Chưa xác định',
          };

          console.log(`[TaskService] Preparing to send email with data:`, JSON.stringify(emailData));

          // Send email notification using the appropriate client and pattern
          await firstValueFrom(
            this.notificationsClient.emit(
              NOTIFICATIONS_PATTERN.SEND_MAINTENANCE_SCHEDULE_EMAIL,
              emailData
            )
          );

          emailSent = true;
          console.log(`[TaskService] Maintenance email sent successfully to resident ${residentName} (${resident.email})`);
        } catch (error) {
          console.error('[TaskService] Error sending maintenance email:', error);
          // Continue with the process even if email fails
        }
      }

      // Return the data needed for notification - make sure to return just the userId string
      return new ApiResponse(true, 'Xử lý nhiệm vụ và báo cáo vết nứt thành công', {
        taskId,
        scheduleJobId: scheduleJobId || task.schedule_job_id,
        crackReportId: task.crack_id,
        residentId: residentId, // This is now a string, not an object
        crackPosition: crackPosition,
        taskStatus: 'Completed',
        crackReportStatus: 'Completed',
        emailSent: emailSent
      });
    } catch (error) {
      console.error('[TaskService] Error in notificationThankstoResident:', error);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException(
        new ApiResponse(false, `Lỗi khi xử lý thông báo: ${error.message}`)
      );
    }
  }

  async getTasksByType(query: GetTasksByTypeDto) {
    console.log(`[TaskService] Getting tasks by type with query:`, query.managerId);
    const startTime = performance.now();
    try {
      // Default values if not provided
      const page = Math.max(1, query?.page || 1);
      const limit = Math.min(50, Math.max(1, query?.limit || 10));
      const statusFilter = query?.statusFilter;
      const taskType = query?.taskType || 'all';
      const managerId = query?.managerId;

      // If manager ID is provided, first get all buildings managed by this manager
      let buildingDetailIds = [];
      if (managerId) {
        try {
          console.log(`Fetching buildings for manager with ID: ${managerId}`);
          const buildingsResponse = await firstValueFrom(
            this.buildingsClient.send(BUILDINGS_PATTERN.GET_BY_MANAGER_ID, { managerId }).pipe(
              timeout(10000), // 10 seconds timeout
              catchError(error => {
                console.error(`Error fetching buildings for manager ${managerId}:`, error);
                return of({ statusCode: 500, data: [] });
              })
            )
          );

          if (buildingsResponse && buildingsResponse.statusCode === 200 && buildingsResponse.data && buildingsResponse.data.length > 0) {
            // Extract all building detail IDs from the buildings
            const buildingDetails = buildingsResponse.data.flatMap(building => building.buildingDetails || []);
            buildingDetailIds = buildingDetails.map(detail => detail.buildingDetailId);

            console.log(`Found ${buildingDetailIds.length} building details for manager ${managerId}`);
          } else {
            console.warn(`No buildings found for manager ${managerId}`);
          }
        } catch (error) {
          console.error(`Error getting buildings for manager ${managerId}:`, error);
        }
      }

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      let whereClause: any = {};

      // Add status filter if provided
      if (statusFilter) {
        whereClause.status = statusFilter as Status;
      }

      // Add task type filter
      if (taskType !== 'all') {
        if (taskType === 'crack') {
          whereClause.crack_id = {
            not: ''
          };
        } else if (taskType === 'schedule') {
          whereClause.schedule_job_id = {
            not: ''
          };
        }
      }

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
          where: whereClause
        }),
      ]);

      const dbQueryTime = performance.now() - startTime;
      console.log(`Database query time: ${dbQueryTime.toFixed(2)}ms`);

      // Fetch both crack info and schedule job info for each task
      const additionalInfoPromises = tasks.map(task => {
        const promises = [];

        if (task.crack_id) {
          promises.push(
            firstValueFrom(
              this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id).pipe(
                timeout(15000),
                catchError(err => {
                  console.error(`Error fetching crack info for task ${task.task_id}:`, err);
                  return of({
                    statusCode: 400,
                    message: 'Không tìm thấy báo cáo vết nứt',
                    data: null,
                  });
                })
              )
            ).then(response => ({ type: 'crack', data: response }))
          );
        }

        if (task.schedule_job_id) {
          promises.push(
            firstValueFrom(
              this.scheduleClient.send(SCHEDULEJOB_PATTERN.GET_BY_ID, { schedule_job_id: task.schedule_job_id }).pipe(
                timeout(15000),
                catchError(err => {
                  console.error(`Error fetching schedule job info for task ${task.task_id}:`, err);
                  return of({
                    statusCode: 400,
                    message: 'Không tìm thấy lịch trình',
                    data: null,
                  });
                })
              )
            ).then(response => ({ type: 'scheduleJob', data: response }))
          );
        }

        return Promise.all(promises);
      });

      const additionalInfoStartTime = performance.now();
      const additionalInfos = await Promise.all(additionalInfoPromises);
      const additionalInfoTime = performance.now() - additionalInfoStartTime;
      console.log(`Additional info fetch time: ${additionalInfoTime.toFixed(2)}ms`);

      // Attach all available info to tasks
      tasks.forEach((task, index) => {
        const infos = additionalInfos[index];
        infos.forEach(info => {
          if (info?.type === 'crack') {
            task['crackInfo'] = info.data;
          }
          if (info?.type === 'scheduleJob') {
            task['schedulesjobInfo'] = info.data;
          }
        });
      });

      // Filter tasks by building details if manager ID was provided
      let filteredTasks = tasks;
      if (managerId && buildingDetailIds.length > 0) {
        filteredTasks = tasks.filter(task => {
          // Check if the task has building information in crackInfo or schedulesjobInfo
          const taskAny = task as any; // Cast to any to access dynamic properties
          const hasBuildingInCrackInfo = taskAny.crackInfo?.data?.some?.(report =>
            report.buildingDetailId && buildingDetailIds.includes(report.buildingDetailId)
          );

          const hasBuildingInScheduleJob = taskAny.schedulesjobInfo?.data?.buildingDetailId &&
            buildingDetailIds.includes(taskAny.schedulesjobInfo.data.buildingDetailId);

          return hasBuildingInCrackInfo || hasBuildingInScheduleJob;
        });

        console.log(`Filtered ${tasks.length} tasks to ${filteredTasks.length} tasks for manager ${managerId}`);
      }

      const totalTime = performance.now() - startTime;
      console.log(`Total execution time: ${totalTime.toFixed(2)}ms`);

      return new PaginationResponseDto(
        filteredTasks,
        filteredTasks.length, // Update the total count to match the filtered results
        page,
        limit,
        200,
        filteredTasks.length > 0 ? 'Lấy danh sách nhiệm vụ thành công' : 'Không tìm thấy nhiệm vụ nào',
      );
    } catch (error) {
      console.error('Error retrieving tasks by type:', error);
      throw new RpcException({
        statusCode: 500,
        message: `Lỗi khi lấy danh sách nhiệm vụ: ${error.message}`,
      });
    }
  }

  async completeTaskAndReview(taskId: string) {
    try {
      // Step 1: Verify the task exists
      const task = await this.prisma.task.findUnique({
        where: { task_id: taskId },
        include: {
          taskAssignments: true // Include task assignments to check their status
        }
      });

      if (!task) {
        throw new RpcException({
          statusCode: 404,
          message: `Không tìm thấy nhiệm vụ với ID ${taskId}`
        });
      }

      // Step 2: Check if any task assignment has a status that prevents completion
      // Check if task has assignments and validate their statuses
      if (task.taskAssignments && task.taskAssignments.length > 0) {
        // Create array of invalid status enum values
        const invalidStatuses = [
          'Unverified',
          'InFixing',
          'Fixed'
        ];

        const invalidAssignments = task.taskAssignments.filter(
          assignment => invalidStatuses.includes(assignment.status)
        );

        if (invalidAssignments.length > 0) {
          const statusLabels = invalidAssignments.map(a => a.status).join(', ');
          throw new RpcException({
            statusCode: 400,
            message: `Không thể hoàn thành nhiệm vụ vì có phân công đang trong trạng thái: ${statusLabels}`
          });
        }
      }

      // Step 3: Update the task status to Completed
      console.log(`[TaskService] Updating task ${taskId} status to Completed`);
      const updatedTask = await this.prisma.task.update({
        where: { task_id: taskId },
        data: { status: Status.Completed }
      });

      // Step 4: Determine if we need to update a crack report or schedule job
      let crackReportUpdated = false;
      let scheduleJobUpdated = false;
      let responseMessage = 'Đã cập nhật trạng thái nhiệm vụ thành Hoàn thành';
      let buildingDetailId = null;
      let buildingManagerId = null;
      let notificationSent = false;
      let notificationTitle = '';
      let notificationContent = '';
      let entityType = '';
      let entityId = '';

      // Step 4a: Update crack report if it exists
      if (task.crack_id) {
        try {
          console.log(`[TaskService] Updating crack report ${task.crack_id} status to Reviewing`);
          const crackResponse = await this.callCrackService(
            CRACK_PATTERNS.GET_DETAILS,
            task.crack_id
          );

          // Try to get buildingDetailId from crack report
          let crackLocation = "Không xác định";
          let buildingName = "tòa nhà";

          if (crackResponse && crackResponse.isSuccess && crackResponse.data && crackResponse.data.length > 0) {
            const crackReport = crackResponse.data[0];
            buildingDetailId = crackReport.buildingDetailId;
            entityType = 'crack';
            entityId = task.crack_id;

            // Extract location information if available
            if (crackReport.position) {
              crackLocation = crackReport.position;
            } else if (crackReport.locationDetail && crackReport.locationDetail.description) {
              crackLocation = crackReport.locationDetail.description;
            }

            // Try to get building name
            if (crackReport.buildingDetail && crackReport.buildingDetail.name) {
              buildingName = crackReport.buildingDetail.name;
            }

            console.log(`[TaskService] Found buildingDetailId ${buildingDetailId} from crack report`);
          }

          const crackUpdateResponse = await this.callCrackService(
            { cmd: 'update-crack-report-for-all-status' },
            {
              crackReportId: task.crack_id,
              dto: {
                status: 'Reviewing',
                suppressNotification: true // Prevent automatic notifications
              }
            }
          );

          if (crackUpdateResponse && crackUpdateResponse.isSuccess) {
            crackReportUpdated = true;
            responseMessage += ' và báo cáo vết nứt thành Đang xem xét';
            console.log(`[TaskService] Successfully updated crack report ${task.crack_id} to Reviewing`);
            notificationTitle = `Xét duyệt sửa chữa vết nứt tại ${crackLocation}`;
            notificationContent = `Công việc sửa chữa vết nứt tại ${crackLocation} ở ${buildingName} đã được hoàn thành và đang chờ bạn xét duyệt. Nhân viên kỹ thuật đã xác nhận hoàn thành công việc và cập nhật trạng thái. Vui lòng xem xét và phê duyệt báo cáo.`;
          } else {
            console.warn(`[TaskService] Failed to update crack report status: ${crackUpdateResponse?.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(`[TaskService] Error updating crack report ${task.crack_id}:`, error);
          // Continue even if crack update fails
        }
      }

      // Step 4b: Update schedule job if it exists
      if (task.schedule_job_id) {
        try {
          console.log(`[TaskService] Updating schedule job ${task.schedule_job_id} status to Reviewing`);

          // Get schedule job to get buildingDetailId
          let scheduleName = "Bảo trì định kỳ";
          let scheduleDate = "gần đây";
          let buildingName = "tòa nhà";
          let deviceType = "";

          const scheduleJobResponse = await firstValueFrom(
            this.scheduleClient.send(
              SCHEDULEJOB_PATTERN.GET_BY_ID,
              { schedule_job_id: task.schedule_job_id }
            ).pipe(
              timeout(10000),
              catchError(err => {
                console.error(`Error getting schedule job ${task.schedule_job_id}:`, err);
                return of(null);
              })
            )
          );

          if (scheduleJobResponse && scheduleJobResponse.data) {
            buildingDetailId = scheduleJobResponse.data.buildingDetailId;
            entityType = 'schedule';
            entityId = task.schedule_job_id;

            // Get schedule name and date if available
            if (scheduleJobResponse.data.schedule && scheduleJobResponse.data.schedule.schedule_name) {
              scheduleName = scheduleJobResponse.data.schedule.schedule_name;
            }

            // Get device type if available
            if (scheduleJobResponse.data.schedule && scheduleJobResponse.data.schedule.cycle &&
              scheduleJobResponse.data.schedule.cycle.device_type) {
              deviceType = scheduleJobResponse.data.schedule.cycle.device_type;
              // Convert enum to human-readable text if it's a device type
              switch (deviceType) {
                case 'Elevator': deviceType = 'thang máy'; break;
                case 'FireProtection': deviceType = 'hệ thống phòng cháy chữa cháy'; break;
                case 'Electrical': deviceType = 'hệ thống điện'; break;
                case 'Plumbing': deviceType = 'hệ thống nước'; break;
                case 'HVAC': deviceType = 'hệ thống HVAC'; break;
                case 'Lighting': deviceType = 'hệ thống chiếu sáng'; break;
                default: deviceType = 'thiết bị'; break;
              }
            }

            // Format date for better display
            if (scheduleJobResponse.data.run_date) {
              const runDate = new Date(scheduleJobResponse.data.run_date);
              scheduleDate = runDate.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            }

            // Try to get building information with a separate call if we have buildingDetailId
            if (buildingDetailId) {
              try {
                const buildingDetailResponse = await firstValueFrom(
                  this.buildingsClient.send(
                    BUILDINGDETAIL_PATTERN.GET_BY_ID,
                    { buildingDetailId }
                  ).pipe(
                    timeout(5000),
                    catchError(err => {
                      console.error(`Error getting building detail ${buildingDetailId}:`, err);
                      return of(null);
                    })
                  )
                );

                if (buildingDetailResponse && buildingDetailResponse.data) {
                  if (buildingDetailResponse.data.name) {
                    buildingName = buildingDetailResponse.data.name;
                  } else if (buildingDetailResponse.data.building && buildingDetailResponse.data.building.name) {
                    buildingName = buildingDetailResponse.data.building.name;
                  }
                }
              } catch (error) {
                console.error(`Error getting building details: ${error.message}`);
              }
            }

            console.log(`[TaskService] Found buildingDetailId ${buildingDetailId} from schedule job`);
          }

          const scheduleUpdateResponse = await firstValueFrom(
            this.scheduleClient.send(
              SCHEDULEJOB_PATTERN.UPDATE_STATUS,
              {
                schedulejobs_id: task.schedule_job_id,
                status: 'Reviewing'
              }
            ).pipe(
              timeout(10000),
              catchError(err => {
                console.error(`Error updating schedule job ${task.schedule_job_id}:`, err);
                return of({
                  isSuccess: false,
                  message: `Failed to update schedule job: ${err.message}`
                });
              })
            )
          );

          if (scheduleUpdateResponse && scheduleUpdateResponse.isSuccess) {
            scheduleJobUpdated = true;
            responseMessage += ' và lịch công việc thành Đang xem xét';
            console.log(`[TaskService] Successfully updated schedule job ${task.schedule_job_id} to Reviewing`);

            // Create specific title and content with collected information
            let titlePrefix = deviceType ? `Bảo trì ${deviceType}` : scheduleName;
            notificationTitle = `Xét duyệt ${titlePrefix} tại ${buildingName}`;

            let contentDevice = deviceType ? `${deviceType}` : "các thiết bị";
            notificationContent = `Công việc "${scheduleName}" cho ${contentDevice} tại ${buildingName} (ngày ${scheduleDate}) đã được nhân viên kỹ thuật hoàn thành. Vui lòng xem xét và phê duyệt báo cáo bảo trì để hoàn tất quy trình.`;
          } else {
            console.warn(`[TaskService] Failed to update schedule job status: ${scheduleUpdateResponse?.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(`[TaskService] Error updating schedule job ${task.schedule_job_id}:`, error);
          // Continue even if schedule job update fails
        }
      }

      // Step 5: Send notification to building manager if we found a buildingDetailId
      if (buildingDetailId) {
        try {
          console.log(`[TaskService] Getting building information for buildingDetailId: ${buildingDetailId}`);

          // Get building detail to find building
          const buildingDetailResponse = await firstValueFrom(
            this.buildingsClient.send(
              BUILDINGDETAIL_PATTERN.GET_BY_ID,
              { buildingDetailId }
            ).pipe(
              timeout(10000),
              catchError(err => {
                console.error(`Error getting building detail ${buildingDetailId}:`, err);
                return of(null);
              })
            )
          );

          if (buildingDetailResponse && buildingDetailResponse.data) {
            const buildingId = buildingDetailResponse.data.buildingId;

            if (buildingId) {
              console.log(`[TaskService] Getting building with ID: ${buildingId}`);

              // Get building to find manager_id
              const buildingResponse = await firstValueFrom(
                this.buildingsClient.send(
                  BUILDINGS_PATTERN.GET_BY_ID,
                  { buildingId }
                ).pipe(
                  timeout(10000),
                  catchError(err => {
                    console.error(`Error getting building ${buildingId}:`, err);
                    return of(null);
                  })
                )
              );

              if (buildingResponse && buildingResponse.data && buildingResponse.data.manager_id) {
                buildingManagerId = buildingResponse.data.manager_id;
                console.log(`[TaskService] Found building manager ID: ${buildingManagerId}`);

                // If we have both a manager ID and notification content, send the notification
                if (notificationTitle && notificationContent) {
                  console.log(`[TaskService] Sending notification to building manager ${buildingManagerId}`);

                  const notificationData = {
                    userId: buildingManagerId,
                    title: notificationTitle,
                    content: notificationContent,
                    type: NotificationType.SYSTEM,
                    relatedId: entityId,
                    link: entityType === 'crack' ? `/crack-reports/${entityId}` : `/schedule-jobs/${entityId}`
                  };

                  await firstValueFrom(
                    this.notificationsClient.emit(
                      NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION,
                      notificationData
                    )
                  );

                  notificationSent = true;
                  console.log(`[TaskService] Notification sent to building manager ${buildingManagerId}`);
                  responseMessage += ` và đã gửi thông báo đến quản lý tòa nhà`;
                }
              } else {
                console.warn(`[TaskService] Building has no manager or could not retrieve building data`);
              }
            } else {
              console.warn(`[TaskService] Building detail has no associated building`);
            }
          } else {
            console.warn(`[TaskService] Could not retrieve building detail information`);
          }
        } catch (error) {
          console.error(`[TaskService] Error sending notification to building manager:`, error);
          // Continue execution even if notification fails
        }
      } else {
        console.warn(`[TaskService] No buildingDetailId found, cannot send notification to building manager`);
      }

      // Return success response with details
      return new ApiResponse(true, responseMessage, {
        taskId,
        taskStatus: 'Completed',
        crackReportId: task.crack_id || null,
        crackReportUpdated,
        scheduleJobId: task.schedule_job_id || null,
        scheduleJobUpdated,
        buildingManagerId,
        notificationSent
      });
    } catch (error) {
      console.error('[TaskService] Error in completeTaskAndReview:', error);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        statusCode: 500,
        message: `Lỗi khi cập nhật nhiệm vụ: ${error.message}`
      });
    }
  }
}
