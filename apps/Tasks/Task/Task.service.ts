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
    private taskAssignmentService: TaskAssignmentsService
  ) {
    this.userService = this.usersClient.getService<UserService>('UserService')
    console.log('TaskService initialized with all clients')

    // Add debug info for clients
    this.scheduleClient.connect().catch(err => console.error('Error connecting to schedule service:', err));
    this.buildingsClient.connect().catch(err => console.error('Error connecting to buildings service:', err));
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
          title: createTaskDto.title,
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
          title: updateTaskDto.title,
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
                  message: 'No crackReport found',
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
                  message: 'No schedule job found',
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
                    message: 'No crackReport found',
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
                    message: 'No schedule job found',
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

  async createTaskForScheduleJob(scheduleJobId: string, staffId?: string) {
    try {
      // Validate input
      if (!scheduleJobId) {
        throw new RpcException(
          new ApiResponse(false, 'scheduleJobId là bắt buộc')
        );
      }

      console.log('Starting task creation for schedule job:', scheduleJobId);

      // Kiểm tra xem task đã được tạo cho scheduleJob này chưa
      const existingTask = await this.prisma.task.findFirst({
        where: { schedule_job_id: scheduleJobId }
      });

      // Nếu task đã tồn tại, trả về luôn
      if (existingTask) {
        console.log(`Task đã tồn tại cho schedule job ${scheduleJobId}, lấy assignment hiện có`);

        const existingAssignment = await this.prisma.taskAssignment.findFirst({
          where: { task_id: existingTask.task_id }
        });

        return new ApiResponse(
          true,
          'Task đã tồn tại cho schedule job này',
          {
            task: existingTask,
            taskAssignment: existingAssignment ? {
              statusCode: 200,
              message: 'Assignment đã tồn tại',
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
      let buildingName: string = "Unknown Building";
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
                          message: `Không tìm thấy lịch công việc: ${err.message}`
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
            message: 'Không tìm thấy lịch công việc hoặc định dạng dữ liệu không hợp lệ'
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
            message: 'Lịch công việc không có thông tin tòa nhà'
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
          "Unknown Building";

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
          areaName = buildingData.areaName || "Unknown Area";
        } else if (buildingDetailResponse.areaId) {
          areaId = buildingDetailResponse.areaId;
          areaName = buildingDetailResponse.areaName || "Unknown Area";
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
                message: `Không tìm thấy Staff Leader cho khu vực ${buildingAreaName}`
              });
            }
          } catch (error) {
            if (error instanceof RpcException) {
              throw error;
            }
            throw new RpcException({
              statusCode: 500,
              message: `Lỗi khi tìm Staff Leader: ${error.message}`
            });
          }
        }

        if (!matchedStaffId) {
          throw new RpcException({
            statusCode: 404,
            message: 'Không tìm thấy Staff Leader để phân công'
          });
        }

        // BƯỚC 5: Tạo task cho schedule job
        console.log(`Creating task for schedule job ${scheduleJobId} in building ${buildingName}`);

        const taskTitle = `Bảo trì định kỳ tòa nhà ${buildingName}`;
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
            new ApiResponse(false, `Lỗi khi tạo task: ${JSON.stringify(createTaskResponse)}`)
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
              new ApiResponse(false, taskAssignmentResponse.message || 'Lỗi phân công task')
            );
          }

          console.log(`Task assigned successfully to staff leader ${matchedStaffId}`);

          // Trả về kết quả thành công
          return new ApiResponse(
            true,
            'Task đã được tạo và phân công cho Staff Leader thành công',
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
            new ApiResponse(false, `Lỗi phân công task: ${assignmentError.message}`)
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
}
