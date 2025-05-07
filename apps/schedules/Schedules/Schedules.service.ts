import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { BUILDINGDETAIL_PATTERN } from '@app/contracts/BuildingDetails/buildingdetails.patterns'
import { NotificationType } from '@app/contracts/notifications/notification.dto'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { ScheduleResponseDto } from '@app/contracts/schedules/Schedule.dto'
import { AutoMaintenanceScheduleDto } from '@app/contracts/schedules/auto-maintenance-schedule.dto'
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto'
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy, RpcException } from '@nestjs/microservices'
import { $Enums, PrismaClient, ScheduleJobStatus } from '@prisma/client-schedule'
import { catchError, firstValueFrom, of } from 'rxjs'
import { timeout } from 'rxjs/operators'
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto'

// Định nghĩa constants cho microservice clients
const TASK_CLIENT = 'TASK_CLIENT'
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'
const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT'

// Các giá trị timeout tối ưu hơn
const MICROSERVICE_TIMEOUT = 10000 // 10 seconds
const TASK_CREATION_TIMEOUT = 20000 // 20 seconds
const MAX_RETRY_ATTEMPTS = 3

// Định nghĩa task status
enum TaskStatus {
  PENDING = 'Pending',
  CREATED = 'Created',
  FAILED = 'Failed'
}

// Phần bổ sung: Task Queue để xử lý bất đồng bộ
interface TaskQueueItem {
  scheduleJobId: string
  attempt: number
  lastAttempt: Date
}

@Injectable()
export class ScheduleService {
  private prisma = new PrismaClient();
  private taskQueue: TaskQueueItem[] = [];
  private isProcessingQueue = false;
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @Inject(TASK_CLIENT) private readonly taskClient: ClientProxy,
    @Inject(BUILDINGS_CLIENT) private readonly buildingClient: ClientProxy,
    @Inject(NOTIFICATION_CLIENT) private readonly notificationsClient: ClientProxy,
  ) {

  }

  // Get all schedules
  async getAllSchedules(
    paginationParams?: PaginationParams,
  ): Promise<PaginationResponseDto<ScheduleResponseDto>> {
    try {
      console.time('Total getAllSchedules execution')

      // Default values if not provided
      const page = Math.max(1, paginationParams?.page || 1)
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10))

      // Calculate skip value for pagination
      const skip = (page - 1) * limit

      console.time('Database queries')
      // Get paginated data
      const [schedules, total] = await Promise.all([
        this.prisma.schedule.findMany({
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: { scheduleJobs: true }, // Include related schedule_job data
        }),
        this.prisma.schedule.count(),
      ])
      console.timeEnd('Database queries')

      console.time('Data transformation')
      // Transform to response DTOs
      const scheduleResponse: ScheduleResponseDto[] = schedules.map(
        (schedule) => ({
          ...schedule,
          start_date: schedule.start_date ? schedule.start_date : null,
          end_date: schedule.end_date ? schedule.end_date : null,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at,
          schedule_job: schedule.scheduleJobs,
        }),
      )
      console.timeEnd('Data transformation')

      console.time('Response creation')
      // Use PaginationResponseDto for consistent response formatting
      const response = new PaginationResponseDto(
        scheduleResponse,
        total,
        page,
        limit,
        200,
        schedules.length > 0
          ? 'Lấy lịch trình thành công'
          : 'Không tìm thấy lịch trình',
      )
      console.timeEnd('Response creation')

      console.timeEnd('Total getAllSchedules execution')
      return response
    } catch (error) {
      console.error('Error retrieving schedules:', error)
      throw new RpcException({
        statusCode: 500,
        message: `Lỗi khi lấy danh sách lịch trình: ${error.message}`,
      })
    }
  }

  // Get schedule by ID
  async getScheduleById(
    schedule_id: string,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: {
          schedule_id, // Truyền trực tiếp UUID
        },
      })
      if (!schedule) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy lịch trình',
        })
      }
      console.log(
        '🚀 ~ ScheduleService ~ getScheduleById ~ schedule:',
        schedule,
      )

      const scheduleResponse: ScheduleResponseDto = {
        ...schedule,
        start_date: schedule.start_date ? schedule.start_date : null,
        end_date: schedule.end_date ? schedule.end_date : null,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at,
      }

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Lấy thông tin lịch trình thành công',
        scheduleResponse,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy thông tin lịch trình',
      })
    }
  }

  // Delete Schedule (Soft Delete)
  async deleteSchedule(schedule_id: string): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      // First check if the schedule exists
      const existingSchedule = await this.prisma.schedule.findUnique({
        where: { schedule_id },
        include: { scheduleJobs: true },
      })

      if (!existingSchedule) {
        return new ApiResponse<ScheduleResponseDto>(
          false,
          `Không tìm thấy lịch trình với ID ${schedule_id}`,
          null
        )
      }

      // Perform soft delete in a transaction
      const deletedSchedule = await this.prisma.$transaction(async (prisma) => {
        // Update schedule status to Cancel
        const schedule = await prisma.schedule.update({
          where: { schedule_id },
          data: {
            schedule_status: ScheduleJobStatus.Cancel,
          },
        })

        // Update all related schedule jobs to Cancel
        await prisma.scheduleJob.updateMany({
          where: { schedule_id },
          data: { status: ScheduleJobStatus.Cancel },
        })

        return schedule
      })

      // Convert to response DTO
      const scheduleResponse: ScheduleResponseDto = {
        ...deletedSchedule,
        start_date: deletedSchedule.start_date ? deletedSchedule.start_date : null,
        end_date: deletedSchedule.end_date ? deletedSchedule.end_date : null,
        created_at: deletedSchedule.created_at,
        updated_at: deletedSchedule.updated_at,
      }

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Đã hủy lịch trình và tất cả các công việc liên quan',
        scheduleResponse
      )
    } catch (error) {
      console.error('Error in deleteSchedule:', error)
      return new ApiResponse<ScheduleResponseDto>(
        false,
        `Không thể hủy lịch trình: ${error.message}`,
        null
      )
    }
  }

  // Phương thức để tạo task và task assignment tự động cho các schedule jobs
  async createTasksForScheduleJobs(scheduleJobs: any[]): Promise<void> {
    const logger = new Logger('CreateTasksForScheduleJobs')

    for (const [index, job] of scheduleJobs.entries()) {
      try {
        // Logging for better debugging
        logger.log(`Processing job ${index + 1}/${scheduleJobs.length}: ${job.schedule_job_id}`)

        if (!job.schedule_job_id) {
          logger.error(`Missing schedule_job_id for job at index ${index}`)
          continue
        }

        // Implement retry mechanism
        let attempts = 0
        const maxAttempts = MAX_RETRY_ATTEMPTS
        let success = false
        let lastError = null

        while (attempts < maxAttempts && !success) {
          try {
            attempts++
            logger.log(`Attempt ${attempts}/${maxAttempts} to create task for job: ${job.schedule_job_id}`)

            // Use the correct pattern format: { cmd: 'pattern-name' }
            const createTaskResponse = await firstValueFrom(
              this.taskClient.send({ cmd: 'create-task-for-schedule-job' }, {
                scheduleJobId: job.schedule_job_id
              }).pipe(
                timeout(TASK_CREATION_TIMEOUT),
                catchError(err => {
                  logger.error(`Task creation error (attempt ${attempts}): ${err.message || 'Unknown error'}`)
                  return of({
                    isSuccess: false,
                    message: err.message || 'Unknown error',
                    data: null
                  })
                })
              )
            )

            // Log the response
            logger.log(`Task creation response: ${JSON.stringify(createTaskResponse)}`)

            // Check if task creation was successful
            if (createTaskResponse && createTaskResponse.isSuccess) {
              success = true
              logger.log(`Successfully created task for job ${job.schedule_job_id}`)
            } else {
              // Task creation failed, will retry if attempts remain
              const errorMsg = createTaskResponse?.message || 'Unknown error'
              lastError = new Error(errorMsg)
              logger.warn(`Task creation failed: ${errorMsg}`)

              // Wait before retrying (exponential backoff)
              if (attempts < maxAttempts) {
                const waitTime = Math.min(1000 * Math.pow(2, attempts - 1), 10000) // Max 10 seconds
                logger.log(`Waiting ${waitTime}ms before retry`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
              }
            }
          } catch (retryError) {
            lastError = retryError
            logger.error(`Error during retry attempt ${attempts}: ${retryError.message}`)

            // Wait before retrying
            if (attempts < maxAttempts) {
              const waitTime = Math.min(1000 * Math.pow(2, attempts - 1), 10000)
              await new Promise(resolve => setTimeout(resolve, waitTime))
            }
          }
        }

        // If all attempts failed, log a final error
        if (!success) {
          logger.error(`Failed to create task for job ${job.schedule_job_id} after ${maxAttempts} attempts`)

          // Add job to a queue for later retry if needed
          this.taskQueue.push({
            scheduleJobId: job.schedule_job_id,
            attempt: 0,
            lastAttempt: new Date()
          })
        }
      } catch (error) {
        logger.error(`Unexpected error processing job ${job?.schedule_job_id || index}: ${error.message}`)
      }
    }

    // If there are any jobs in the queue and we're not already processing it, start queue processing
    if (this.taskQueue.length > 0 && !this.isProcessingQueue) {
      this.logger.log(`Queueing ${this.taskQueue.length} failed tasks for later retry`)
    }
  }

  // Cập nhật method createAutoMaintenanceSchedule để tạo tasks tự động
  async createAutoMaintenanceSchedule(
    dto: AutoMaintenanceScheduleDto
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      // 1. Validate maintenance cycle
      const maintenanceCycle = await this.prisma.maintenanceCycle.findUnique({
        where: { cycle_id: dto.cycle_id }
      })

      if (!maintenanceCycle) {
        throw new RpcException({
          statusCode: 404,
          message: `Không tìm thấy chu kỳ bảo trì với ID ${dto.cycle_id}`,
        })
      }

      // 2. Validate dates
      const startDate = new Date(dto.start_date)
      const endDate = new Date(dto.end_date)
      const now = new Date()

      // Validate start date is not in the past
      if (startDate < now) {
        throw new RpcException({
          statusCode: 400,
          message: 'Ngày bắt đầu không thể trong quá khứ',
        })
      }

      // Validate end date is after start date
      if (endDate <= startDate) {
        throw new RpcException({
          statusCode: 400,
          message: 'Ngày kết thúc phải sau ngày bắt đầu',
        })
      }

      // 3. Validate building detail IDs
      if (dto.buildingDetailIds && dto.buildingDetailIds.length > 0) {
        try {
          const invalidBuildingDetailIds = []

          for (const buildingDetailId of dto.buildingDetailIds) {
            try {
              console.log(`Validating building detail ID: ${buildingDetailId}`)

              const buildingResponse = await firstValueFrom(
                this.buildingClient
                  .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
                  .pipe(
                    timeout(15000),
                    catchError(err => {
                      console.error(`Error checking building detail ${buildingDetailId}:`, err.message || err)
                      return of({
                        statusCode: 404,
                        message: `Kiểm tra chi tiết tòa nhà hết thời gian chờ`,
                        isTimeout: true
                      })
                    })
                  )
              )

              if (!buildingResponse ||
                buildingResponse.statusCode !== 200 ||
                !buildingResponse.data ||
                buildingResponse.isTimeout) {
                console.log(`Building detail ID ${buildingDetailId} is invalid. Adding to invalid list.`)
                invalidBuildingDetailIds.push(buildingDetailId)
              }
            } catch (error) {
              console.error(`Unexpected error validating building detail ${buildingDetailId}:`, error)
              invalidBuildingDetailIds.push(buildingDetailId)
            }
          }

          if (invalidBuildingDetailIds.length > 0) {
            throw new RpcException({
              statusCode: 404,
              message: `Các ID chi tiết tòa nhà sau không tồn tại: ${invalidBuildingDetailIds.join(', ')}`,
            })
          }
        } catch (error) {
          if (error instanceof RpcException) throw error
          throw new RpcException({
            statusCode: 500,
            message: `Lỗi khi xác thực ID chi tiết tòa nhà: ${error.message}`,
          })
        }
      }

      // 4. Tính toán thông số cho việc phân bổ
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const totalBuildings = dto.buildingDetailIds.length

      // Tính khoảng thời gian bảo trì dựa trên frequency
      let intervalDays
      switch (maintenanceCycle.frequency) {
        case 'Daily': intervalDays = 1; break
        case 'Weekly': intervalDays = 7; break
        case 'Monthly': intervalDays = 30; break
        case 'Yearly': intervalDays = 365; break
        default: intervalDays = 30
      }

      // 5. Tạo schedule và jobs trong transaction với logic phân bổ mới
      const newSchedule = await this.prisma.$transaction(async (prisma) => {
        // Tạo schedule chính
        const schedule = await prisma.schedule.create({
          data: {
            schedule_name: dto.schedule_name,
            description: dto.description || `Lịch bảo trì tự động tạo cho ${maintenanceCycle.device_type}`,
            cycle_id: dto.cycle_id,
            start_date: startDate,
            end_date: endDate,
            schedule_status: $Enums.ScheduleStatus.InProgress,
            managerid: dto.managerId, // Add manager ID from the DTO
          },
        })

        const createdJobs = []
        if (dto.buildingDetailIds?.length > 0) {
          // Tính số lượng chu kỳ bảo trì có thể thực hiện
          const possibleMaintenanceCycles = Math.floor(totalDays / intervalDays)

          // Tạo jobs cho từng building
          const scheduleJobs = dto.buildingDetailIds.flatMap((buildingDetailId, buildingIndex) => {
            const jobs = []
            let currentDate = new Date(startDate)

            // Tính offset cho mỗi building để phân bổ đều
            const offsetDays = Math.floor((intervalDays / totalBuildings) * buildingIndex)
            currentDate.setDate(currentDate.getDate() + offsetDays)

            while (currentDate < endDate) {
              const jobEndDate = new Date(currentDate)
              jobEndDate.setDate(jobEndDate.getDate() + intervalDays)

              // Đảm bảo không vượt quá end date của schedule
              const finalEndDate = jobEndDate > endDate ? endDate : jobEndDate

              // Chỉ tạo job nếu còn đủ thời gian cho một chu kỳ bảo trì tối thiểu
              if (currentDate < endDate) {
                jobs.push({
                  schedule_id: schedule.schedule_id,
                  run_date: new Date(currentDate),
                  status: $Enums.ScheduleJobStatus.InProgress,
                  buildingDetailId: buildingDetailId,
                  start_date: new Date(currentDate),
                  end_date: finalEndDate
                })
              }

              // Tính ngày bắt đầu cho chu kỳ tiếp theo
              currentDate = new Date(currentDate)
              currentDate.setDate(currentDate.getDate() + intervalDays * totalBuildings)
            }

            return jobs
          })

          // Tạo tất cả jobs
          await prisma.scheduleJob.createMany({
            data: scheduleJobs,
          })

          // Lấy thông tin đầy đủ của jobs
          const fullScheduleJobs = await prisma.scheduleJob.findMany({
            where: {
              schedule_id: schedule.schedule_id,
            },
            include: {
              schedule: true,
            },
          })

          createdJobs.push(...fullScheduleJobs)
        }

        return { schedule, createdJobs }
      })

      // 6. Create tasks for jobs
      if (newSchedule.createdJobs?.length > 0) {
        await this.createTasksForScheduleJobs(newSchedule.createdJobs)

        // Send notifications
        try {
          const buildingDetailIds = dto.buildingDetailIds
          const buildingResults = await Promise.all(
            buildingDetailIds.map(buildingDetailId =>
              firstValueFrom(
                this.buildingClient
                  .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
                  .pipe(
                    timeout(10000),
                    catchError(error => of(null))
                  )
              )
            )
          )

          const buildingNames = buildingResults
            .filter(result => result && result.data)
            .map(result => result.data.name || 'Tòa nhà không tên')
            .join(', ')

          const formattedStartDate = startDate.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

          const formattedEndDate = endDate.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

          // Create system notification
          const notificationData = {
            title: `Lịch bảo trì mới ${maintenanceCycle.device_type} đã được tạo`,
            content: `Lịch bảo trì ${dto.schedule_name} cho ${maintenanceCycle.device_type} tại ${buildingNames} đã được lên lịch từ ${formattedStartDate} đến ${formattedEndDate}.`,
            type: NotificationType.SYSTEM,
            broadcastToAll: true,
            link: `/schedules/${newSchedule.schedule.schedule_id}`,
            relatedId: newSchedule.schedule.schedule_id
          }

          await firstValueFrom(
            this.notificationsClient.emit(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION, notificationData)
              .pipe(
                timeout(10000),
                catchError(error => of({ success: false }))
              )
          )
        } catch (notifyError) {
          this.logger.error(`Error sending notifications: ${notifyError.message}`)
        }
      }

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Tạo lịch trình bảo trì tự động thành công',
        {
          ...newSchedule.schedule,
          start_date: newSchedule.schedule.start_date,
          end_date: newSchedule.schedule.end_date,
          created_at: newSchedule.schedule.created_at,
          updated_at: newSchedule.schedule.updated_at,
        }
      )
    } catch (error) {
      console.error('Error creating automated maintenance schedule:', error)
      if (error instanceof RpcException) throw error
      throw new RpcException({
        statusCode: 500,
        message: `Không thể tạo lịch trình bảo trì tự động: ${error.message}`,
      })
    }
  }

  // Cập nhật method triggerAutoMaintenanceSchedule để tạo tasks tự động
  async triggerAutoMaintenanceSchedule(managerId: string): Promise<ApiResponse<string>> {
    try {
      this.logger.log(`Triggering auto maintenance schedule for manager: ${managerId}`);

      // Lấy tất cả các MaintenanceCycle
      const maintenanceCycles = await this.prisma.maintenanceCycle.findMany()

      if (!maintenanceCycles || maintenanceCycles.length === 0) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy chu kỳ bảo trì để tạo lịch trình',
        })
      }

      // Lấy tất cả các tòa nhà
      const buildings: { buildingDetailId: string }[] = await this.prisma.$queryRaw`
        SELECT DISTINCT "buildingDetailId" FROM "ScheduleJob"
      `

      if (!buildings || buildings.length === 0) {
        throw new RpcException({
          statusCode: 404,
          message: 'Không tìm thấy tòa nhà để tạo lịch trình bảo trì',
        })
      }

      // Số lượng lịch được tạo
      let createdSchedulesCount = 0

      // Lưu lại các jobs đã tạo để tạo task
      const allCreatedJobs = []

      // Lưu thông tin các lịch bảo trì đã tạo để gửi thông báo
      const createdSchedules = []

      // Duyệt qua từng cycle để tạo lịch bảo trì
      for (const cycle of maintenanceCycles) {
        // Tính toán ngày bắt đầu và kết thúc dựa trên tần suất
        const now = new Date()
        let endDate = new Date(now)

        switch (cycle.frequency) {
          case 'Daily':
            endDate.setDate(endDate.getDate() + 30)
            break
          case 'Weekly':
            endDate.setDate(endDate.getDate() + 90)
            break
          case 'Monthly':
            endDate.setFullYear(endDate.getFullYear() + 1)
            break
          case 'Yearly':
            endDate.setFullYear(endDate.getFullYear() + 3)
            break
          default:
            endDate.setFullYear(endDate.getFullYear() + 1)
        }

        try {
          // Tạo một lịch bảo trì mới
          const schedule = await this.prisma.schedule.create({
            data: {
              schedule_name: `Tự động Bảo trì ${cycle.device_type} - ${now.toISOString().slice(0, 10)}`,
              description: `Lịch bảo trì tự động tạo cho ${cycle.device_type}`,
              cycle_id: cycle.cycle_id,
              start_date: now,
              end_date: endDate,
              schedule_status: $Enums.ScheduleStatus.InProgress,
              managerid: managerId, // Add manager ID to schedule (using correct field name)
            },
          })

          // Lưu lại thông tin lịch bảo trì để gửi thông báo
          createdSchedules.push({
            schedule,
            cycle,
            startDate: now,
            endDate
          })

          // Tạo các ScheduleJob cho mỗi tòa nhà
          const buildingDetailIds = buildings.map(b => b.buildingDetailId)

          // Hàm tính toán tăng run_date dựa trên frequency
          const calcNextDate = (baseDate: Date, frequency: string, steps: number = 1): Date => {
            const result = new Date(baseDate)
            switch (frequency) {
              case 'Daily':
                result.setDate(result.getDate() + (steps * 1))
                break
              case 'Weekly':
                result.setDate(result.getDate() + (steps * 7))
                break
              case 'Monthly':
                result.setMonth(result.getMonth() + steps)
                break
              case 'Yearly':
                result.setFullYear(result.getFullYear() + steps)
                break
              default:
                result.setMonth(result.getMonth() + steps)
            }
            return result
          }

          // Hàm tính toán thời gian kết thúc dựa trên run_date và frequency
          const calcEndDate = (runDate: Date, frequency: string): Date => {
            const result = new Date(runDate)
            switch (frequency) {
              case 'Daily':
                result.setDate(result.getDate() + 1) // Kết thúc sau 1 ngày
                break
              case 'Weekly':
                result.setDate(result.getDate() + 7) // Kết thúc sau 1 tuần
                break
              case 'Monthly':
                result.setMonth(result.getMonth() + 1) // Kết thúc sau 1 tháng
                break
              case 'Yearly':
                result.setFullYear(result.getFullYear() + 1) // Kết thúc sau 1 năm
                break
              default:
                result.setMonth(result.getMonth() + 1) // Mặc định kết thúc sau 1 tháng
            }
            return result
          }

          // Tạo schedule jobs cho mỗi building với run_date tăng dần theo frequency
          const scheduleJobs = buildingDetailIds.map((buildingDetailId, index) => {
            // Tính run_date dựa vào vị trí của building và frequency
            const buildingRunDate = calcNextDate(now, cycle.frequency, index)

            // Tính endDate dựa trên run_date và frequency
            const buildingEndDate = calcEndDate(buildingRunDate, cycle.frequency)

            return {
              schedule_id: schedule.schedule_id,
              run_date: buildingRunDate,
              status: $Enums.ScheduleJobStatus.Pending,
              buildingDetailId: buildingDetailId,
              start_date: buildingRunDate, // startDate là chính run_date
              end_date: buildingEndDate // endDate tính từ run_date theo frequency
            }
          })

          // Thêm các công việc bảo trì vào DB
          await this.prisma.scheduleJob.createMany({
            data: scheduleJobs,
          })

          // Lấy thông tin đầy đủ của các jobs vừa tạo
          const fullScheduleJobs = await this.prisma.scheduleJob.findMany({
            where: {
              schedule_id: schedule.schedule_id,
            },
            include: {
              schedule: true,
            },
          })

          // Thêm vào danh sách để tạo task
          allCreatedJobs.push(...fullScheduleJobs)

          createdSchedulesCount++
        } catch (error) {
          this.logger.error(`Error creating schedule for cycle ${cycle.cycle_id}:`, error)
        }
      }

      // Tạo task và task assignment cho tất cả jobs đã tạo
      if (allCreatedJobs.length > 0) {
        await this.createTasksForScheduleJobs(allCreatedJobs)
      }

      // Gửi thông báo về các lịch bảo trì tự động đã được tạo
      if (createdSchedules.length > 0) {
        try {
          // Lấy thông tin các tòa nhà cho thông báo
          const buildingDetailIds = buildings.map(b => b.buildingDetailId)
          const buildingPromises = buildingDetailIds.map(buildingDetailId =>
            firstValueFrom(
              this.buildingClient
                .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
                .pipe(
                  timeout(10000),
                  catchError(error => {
                    this.logger.error(`Error getting building detail ${buildingDetailId}: ${error.message}`)
                    return of(null)
                  })
                )
            )
          )

          const buildingResults = await Promise.all(buildingPromises)
          const buildingNames = buildingResults
            .filter(result => result && result.data)
            .map(result => result.data.name || 'Tòa nhà không tên')
            .join(', ')

          // Tạo thông báo hệ thống về các lịch bảo trì tự động mới
          const formattedSchedules = createdSchedules.map(schedule => {
            const formattedStartDate = schedule.startDate.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })

            const formattedEndDate = schedule.endDate.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })

            return `${schedule.cycle.device_type} (${formattedStartDate} - ${formattedEndDate})`
          }).join(', ')

          // Tạo và gửi thông báo cho tất cả người dùng
          const notificationData = {
            title: `Lịch bảo trì tự động mới đã được tạo`,
            content: `Hệ thống đã tự động tạo ${createdSchedules.length} lịch bảo trì mới: ${formattedSchedules} cho các tòa nhà: ${buildingNames}.`,
            type: NotificationType.SYSTEM,
            broadcastToAll: true,
            link: `/schedules`
          }

          this.logger.log(`Sending system-wide notification about ${createdSchedules.length} new auto maintenance schedules`)
          await firstValueFrom(
            this.notificationsClient.emit(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION, notificationData)
              .pipe(
                timeout(10000),
                catchError(error => {
                  this.logger.error(`Error sending system-wide notification: ${error.message}`)
                  return of({ success: false })
                })
              )
          )
        } catch (notifyError) {
          this.logger.error(`Error sending notifications about auto maintenance schedules: ${notifyError.message}`)
        }
      }

      return new ApiResponse<string>(
        true,
        `Đã kích hoạt tạo lịch trình bảo trì tự động thành công. Đã tạo ${createdSchedulesCount} lịch trình.`,
        `Đã tạo ${createdSchedulesCount} lịch trình từ ${maintenanceCycles.length} chu kỳ bảo trì với ${allCreatedJobs.length} nhiệm vụ được phân công`
      )
    } catch (error) {
      console.error('Error triggering auto maintenance schedules:', error)
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi kích hoạt tạo lịch trình bảo trì tự động',
      })
    }
  }

  // Create a new schedule
  async createSchedule(
    createScheduleDto: CreateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      // Validate maintenance cycle existence
      const maintenanceCycle = await this.prisma.maintenanceCycle.findUnique({
        where: { cycle_id: createScheduleDto.cycle_id }
      })

      if (!maintenanceCycle) {
        throw new RpcException({
          statusCode: 404,
          message: `Không tìm thấy chu kỳ bảo trì với ID ${createScheduleDto.cycle_id}`,
        })
      }

      // Validate all building detail IDs exist before proceeding
      if (createScheduleDto.buildingDetailIds && createScheduleDto.buildingDetailIds.length > 0) {
        try {
          const invalidBuildingDetailIds = []

          for (const buildingDetailId of createScheduleDto.buildingDetailIds) {
            try {
              console.log(`Validating building detail ID: ${buildingDetailId}`)

              // Use a longer timeout and proper error handling
              const buildingResponse = await firstValueFrom(
                this.buildingClient
                  .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
                  .pipe(
                    timeout(15000),  // Increase timeout to 15 seconds
                    catchError(err => {
                      console.error(`Error checking building detail ${buildingDetailId}:`, err.message || err)
                      // For timeout errors, return a structured response rather than throwing
                      return of({
                        statusCode: 404,
                        message: `Kiểm tra chi tiết tòa nhà hết thời gian chờ`,
                        isTimeout: true
                      })
                    })
                  )
              )

              // Proper validation of the response
              console.log(`Building detail response for ${buildingDetailId}:`,
                typeof buildingResponse === 'object' ?
                  `statusCode=${buildingResponse.statusCode}, message=${buildingResponse.message}` :
                  'invalid response format')

              // Only consider a building detail valid if we get a 200 response with data
              if (!buildingResponse ||
                buildingResponse.statusCode !== 200 ||
                !buildingResponse.data ||
                buildingResponse.isTimeout) {
                console.log(`Building detail ID ${buildingDetailId} is invalid. Adding to invalid list.`)
                invalidBuildingDetailIds.push(buildingDetailId)
              } else {
                console.log(`Building detail ID ${buildingDetailId} validated successfully`)
              }
            } catch (error) {
              // Any unexpected error means we couldn't validate the building detail
              console.error(`Unexpected error validating building detail ${buildingDetailId}:`, error)
              invalidBuildingDetailIds.push(buildingDetailId)
            }
          }

          // If any building details are invalid, throw a 404 exception
          if (invalidBuildingDetailIds.length > 0) {
            console.error(`Found ${invalidBuildingDetailIds.length} invalid building detail IDs:`, invalidBuildingDetailIds)
            throw new RpcException({
              statusCode: 404,
              message: `Các ID chi tiết tòa nhà sau không tồn tại: ${invalidBuildingDetailIds.join(', ')}`,
            })
          }

          console.log('All building detail IDs validated successfully')
        } catch (error) {
          // Rethrow RPC exceptions
          if (error instanceof RpcException) {
            throw error
          }

          // For any other errors in the validation process, throw a generic error
          console.error('Error validating building detail IDs:', error)
          throw new RpcException({
            statusCode: 500,
            message: `Lỗi khi xác thực ID chi tiết tòa nhà: ${error.message}`,
          })
        }
      }

      // Create the schedule
      const newSchedule = await this.prisma.schedule.create({
        data: {
          schedule_name: createScheduleDto.schedule_name,
          description: createScheduleDto.description,
          start_date: createScheduleDto.start_date ? new Date(createScheduleDto.start_date) : null,
          end_date: createScheduleDto.end_date ? new Date(createScheduleDto.end_date) : null,
          schedule_status: createScheduleDto.schedule_status || $Enums.ScheduleStatus.InProgress,
          cycle_id: createScheduleDto.cycle_id,
          managerid: createScheduleDto.managerid,
        },
      })

      // Create schedule jobs if building detail IDs are provided
      let scheduleJobs = []

      if (createScheduleDto.buildingDetailIds && createScheduleDto.buildingDetailIds.length > 0) {
        const startDate = newSchedule.start_date || new Date()

        // Send notification about the new schedule
        try {
          // Fetch building details to include their names in the notification
          const buildingPromises = createScheduleDto.buildingDetailIds.map(buildingDetailId =>
            firstValueFrom(
              this.buildingClient
                .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
                .pipe(
                  timeout(10000),
                  catchError(error => {
                    this.logger.error(`Error getting building detail ${buildingDetailId}: ${error.message}`)
                    return of(null)
                  })
                )
            )
          )

          const buildingResults = await Promise.all(buildingPromises)
          const buildingNames = buildingResults
            .filter(result => result && result.data)
            .map(result => result.data.name || 'Tòa nhà không tên')
            .join(', ')

          // Format dates for notification
          const formattedStartDate = newSchedule.start_date?.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) || 'N/A'

          const formattedEndDate = newSchedule.end_date?.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) || 'N/A'

          // Fetch cycle information
          const cycle = await this.prisma.maintenanceCycle.findUnique({
            where: { cycle_id: newSchedule.cycle_id }
          })

          // Create and send notification for all users
          const notificationData = {
            title: `Lịch bảo trì mới đã được tạo`,
            content: `Lịch bảo trì mới "${newSchedule.schedule_name}" đã được tạo cho ${cycle?.device_type || 'thiết bị'} từ ${formattedStartDate} đến ${formattedEndDate} cho các tòa nhà: ${buildingNames}.`,
            type: NotificationType.SYSTEM,
            broadcastToAll: true,
            link: `/schedules/${newSchedule.schedule_id}`
          }

          this.logger.log(`Sending system-wide notification about new maintenance schedule: ${newSchedule.schedule_name}`)
          await firstValueFrom(
            this.notificationsClient.emit(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION, notificationData)
              .pipe(
                timeout(10000),
                catchError(error => {
                  this.logger.error(`Error sending system-wide notification: ${error.message}`)
                  return of({ success: false })
                })
              )
          )
        } catch (notifyError) {
          this.logger.error(`Error sending notification about new maintenance schedule: ${notifyError.message}`)
        }

        // Hàm tính toán tăng run_date dựa trên frequency
        const calcNextDate = (baseDate: Date, frequency: string, steps: number = 1): Date => {
          const result = new Date(baseDate)
          switch (frequency) {
            case 'Daily':
              result.setDate(result.getDate() + (steps * 1))
              break
            case 'Weekly':
              result.setDate(result.getDate() + (steps * 7))
              break
            case 'Monthly':
              result.setMonth(result.getMonth() + steps)
              break
            case 'Yearly':
              result.setFullYear(result.getFullYear() + steps)
              break
            default:
              result.setMonth(result.getMonth() + steps)
          }
          return result
        }

        // Hàm tính toán thời gian kết thúc dựa trên run_date và frequency
        const calcEndDate = (runDate: Date, frequency: string): Date => {
          const result = new Date(runDate)
          switch (frequency) {
            case 'Daily':
              result.setDate(result.getDate() + 1) // Kết thúc sau 1 ngày
              break
            case 'Weekly':
              result.setDate(result.getDate() + 7) // Kết thúc sau 1 tuần
              break
            case 'Monthly':
              result.setMonth(result.getMonth() + 1) // Kết thúc sau 1 tháng
              break
            case 'Yearly':
              result.setFullYear(result.getFullYear() + 1) // Kết thúc sau 1 năm
              break
            default:
              result.setMonth(result.getMonth() + 1) // Mặc định kết thúc sau 1 tháng
          }
          return result
        }

        // Tạo schedule jobs cho mỗi building với run_date tăng dần theo frequency
        const scheduleJobsData = createScheduleDto.buildingDetailIds.map((buildingDetailId, index) => {
          // Tính run_date dựa vào vị trí của building và frequency
          const buildingRunDate = calcNextDate(startDate, maintenanceCycle.frequency, index)

          // Tính endDate dựa trên run_date và frequency
          const buildingEndDate = calcEndDate(buildingRunDate, maintenanceCycle.frequency)

          return {
            schedule_id: newSchedule.schedule_id,
            run_date: buildingRunDate,
            status: $Enums.ScheduleJobStatus.Pending,
            buildingDetailId: buildingDetailId,
            start_date: buildingRunDate, // startDate là chính run_date
            end_date: buildingEndDate // endDate tính từ run_date theo frequency
          }
        })

        // Create jobs
        await this.prisma.scheduleJob.createMany({
          data: scheduleJobsData,
        })

        // Get the created jobs
        scheduleJobs = await this.prisma.scheduleJob.findMany({
          where: { schedule_id: newSchedule.schedule_id },
        })
      }

      // Format the response
      const scheduleResponse: ScheduleResponseDto = {
        ...newSchedule,
        schedule_job: scheduleJobs,
      }

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Tạo lịch trình thành công',
        scheduleResponse,
      )
    } catch (error) {
      console.error('Error creating schedule:', error)

      if (error instanceof RpcException) {
        throw error
      }

      throw new RpcException({
        statusCode: 500,
        message: `Không thể tạo lịch trình: ${error.message}`,
      })
    }
  }

  // Update an existing schedule
  async updateSchedule(
    schedule_id: string,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      // Check if schedule exists
      const existingSchedule = await this.prisma.schedule.findUnique({
        where: { schedule_id },
        include: {
          scheduleJobs: true // Include scheduleJobs để kiểm tra trạng thái
        }
      })

      if (!existingSchedule) {
        throw new RpcException({
          statusCode: 404,
          message: `Không tìm thấy lịch trình với ID ${schedule_id}`,
        })
      }

      // Prepare update data
      const updateData: any = {}

      if (updateScheduleDto.schedule_name) updateData.schedule_name = updateScheduleDto.schedule_name
      if (updateScheduleDto.description !== undefined) updateData.description = updateScheduleDto.description
      if (updateScheduleDto.start_date) updateData.start_date = new Date(updateScheduleDto.start_date)
      if (updateScheduleDto.end_date) updateData.end_date = new Date(updateScheduleDto.end_date)
      if (updateScheduleDto.schedule_status) updateData.schedule_status = updateScheduleDto.schedule_status
      if (updateScheduleDto.cycle_id) updateData.cycle_id = updateScheduleDto.cycle_id

      // Khởi tạo mảng để lưu trữ các schedule jobs mới cần tạo task
      const newScheduleJobs = [];

      // Handle building detail IDs if provided
      if (updateScheduleDto.buildingDetailIds && updateScheduleDto.buildingDetailIds.length > 0) {
        // Lấy thông tin maintenance cycle
        const maintenanceCycle = await this.prisma.maintenanceCycle.findUnique({
          where: { cycle_id: updateScheduleDto.cycle_id || existingSchedule.cycle_id }
        })

        if (!maintenanceCycle) {
          throw new RpcException({
            statusCode: 404,
            message: `Chu kỳ bảo trì với ID ${updateScheduleDto.cycle_id || existingSchedule.cycle_id} không tìm thấy`,
          })
        }

        // Tính toán thời gian cho jobs
        const startDate = updateData.start_date || existingSchedule.start_date
        const endDate = updateData.end_date || existingSchedule.end_date
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const totalBuildings = updateScheduleDto.buildingDetailIds.length

        // Tính khoảng thời gian bảo trì dựa trên frequency
        let intervalDays
        switch (maintenanceCycle.frequency) {
          case 'Daily': intervalDays = 1; break
          case 'Weekly': intervalDays = 7; break
          case 'Monthly': intervalDays = 30; break
          case 'Yearly': intervalDays = 365; break
          default: intervalDays = 30
        }

        this.logger.log(`Maintenance frequency: ${maintenanceCycle.frequency}, intervalDays: ${intervalDays}, totalDays: ${totalDays}`)

        // Thực hiện update trong transaction
        await this.prisma.$transaction(async (prisma) => {
          // Update schedule
          await prisma.schedule.update({
            where: { schedule_id },
            data: updateData,
          })

          // Danh sách buildingDetailIds cần tạo scheduleJobs mới
          const buildingDetailsToCreate = [];

          // Kiểm tra từng buildingDetailId
          for (const buildingDetailId of updateScheduleDto.buildingDetailIds) {
            // Tìm tất cả scheduleJobs hiện tại với buildingDetailId này
            const existingJobs = existingSchedule.scheduleJobs.filter(
              job => job.buildingDetailId === buildingDetailId
            );

            // Kiểm tra xem có bất kỳ scheduleJob nào đang active (không phải Cancel) không
            const hasActiveJob = existingJobs.some(
              job => job.status !== $Enums.ScheduleJobStatus.Cancel
            );

            // Nếu không có jobs nào hoặc tất cả đều đã bị Cancel, thêm vào danh sách cần tạo mới
            if (existingJobs.length === 0 || !hasActiveJob) {
              buildingDetailsToCreate.push(buildingDetailId);
            }
          }

          // Log kết quả kiểm tra
          this.logger.log(`Building details to create new jobs: ${buildingDetailsToCreate.length > 0 ? buildingDetailsToCreate.join(', ') : 'None'}`);

          // Nếu có buildingDetailIds cần tạo scheduleJobs mới
          if (buildingDetailsToCreate.length > 0) {
            // Tính số lượng chu kỳ bảo trì có thể thực hiện
            const possibleMaintenanceCycles = Math.floor(totalDays / intervalDays)
            this.logger.log(`Possible maintenance cycles: ${possibleMaintenanceCycles}`)

            // Tạo jobs cho từng building - áp dụng logic giống createAutoMaintenanceSchedule
            const scheduleJobs = buildingDetailsToCreate.flatMap((buildingDetailId, buildingIndex) => {
              const jobs = []
              let currentDate = new Date(startDate)

              // Tính offset cho mỗi building để phân bổ đều
              const offsetDays = Math.floor((intervalDays / totalBuildings) * buildingIndex)
              currentDate.setDate(currentDate.getDate() + offsetDays)

              this.logger.log(`Building ${buildingDetailId}, offsetDays: ${offsetDays}, startDate: ${currentDate.toISOString()}`)

              while (currentDate < endDate) {
                const jobEndDate = new Date(currentDate)
                jobEndDate.setDate(jobEndDate.getDate() + intervalDays)

                // Đảm bảo không vượt quá end date của schedule
                const finalEndDate = jobEndDate > endDate ? endDate : jobEndDate

                if (currentDate < endDate) {
                  jobs.push({
                    schedule_id: schedule_id,
                    run_date: new Date(currentDate),
                    status: $Enums.ScheduleJobStatus.Pending,
                    buildingDetailId: buildingDetailId,
                    start_date: new Date(currentDate),
                    end_date: finalEndDate
                  })

                  this.logger.log(`Created job for building ${buildingDetailId}, run_date: ${currentDate.toISOString()}, end_date: ${finalEndDate.toISOString()}`)
                }

                // Tính ngày bắt đầu cho chu kỳ tiếp theo - nhân với số lượng buildings để phân phối đều
                currentDate = new Date(currentDate)
                currentDate.setDate(currentDate.getDate() + intervalDays * totalBuildings)
              }

              this.logger.log(`Total jobs created for building ${buildingDetailId}: ${jobs.length}`)
              return jobs
            })

            // Tạo các scheduleJobs mới
            if (scheduleJobs.length > 0) {
              this.logger.log(`Creating ${scheduleJobs.length} new schedule jobs`)

              await prisma.scheduleJob.createMany({
                data: scheduleJobs,
              });

              // Lấy thông tin đầy đủ của các scheduleJobs vừa tạo
              const createdJobs = await prisma.scheduleJob.findMany({
                where: {
                  schedule_id: schedule_id,
                  buildingDetailId: {
                    in: buildingDetailsToCreate
                  },
                  status: $Enums.ScheduleJobStatus.Pending // Chỉ lấy các job mới tạo với status Pending
                }
              });

              // Thêm vào danh sách cần tạo task
              newScheduleJobs.push(...createdJobs);
              this.logger.log(`Retrieved ${createdJobs.length} new schedule jobs`)
            }
          }
        });

        // Tạo tasks và task assignments cho các scheduleJobs mới
        if (newScheduleJobs.length > 0) {
          console.log(`Creating tasks for ${newScheduleJobs.length} new schedule jobs`);
          try {
            await this.createTasksForScheduleJobs(newScheduleJobs);
          } catch (taskError) {
            console.error(`Error creating tasks for schedule jobs: ${taskError.message}`);
            // Vẫn tiếp tục thực hiện, không throw lỗi ở đây
          }
        }
      } else {
        // Nếu không có buildingDetailIds, chỉ update schedule
        await this.prisma.schedule.update({
          where: { schedule_id },
          data: updateData,
        });
      }

      // Get updated schedule with all jobs
      const updatedSchedule = await this.prisma.schedule.findUnique({
        where: { schedule_id },
        include: {
          scheduleJobs: true,
        },
      });

      // Format the response
      const scheduleResponse: ScheduleResponseDto = {
        ...updatedSchedule,
        schedule_job: updatedSchedule.scheduleJobs,
      };

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Cập nhật lịch trình thành công',
        scheduleResponse,
      );
    } catch (error) {
      console.error('Error updating schedule:', error);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        statusCode: 500,
        message: `Không thể cập nhật lịch trình: ${error.message}`,
      });
    }
  }

  async generateSchedulesFromConfig(configDto: any): Promise<ApiResponse<any>> {
    try {
      const { cycle_configs, buildingDetails } = configDto;
      const logger = new Logger('GenerateSchedulesFromConfig');

      // Validate building details IDs
      if (!buildingDetails || buildingDetails.length === 0) {
        throw new RpcException({
          statusCode: 400,
          message: 'Cần ít nhất một ID chi tiết tòa nhà',
        });
      }

      // Validate building details existence
      try {
        const invalidBuildingDetailIds = [];
        for (const buildingDetailId of buildingDetails) {
          try {
            logger.log(`Validating building detail ID: ${buildingDetailId}`);
            const buildingResponse = await firstValueFrom(
              this.buildingClient
                .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
                .pipe(
                  timeout(15000),
                  catchError(err => {
                    logger.error(`Error checking building detail ${buildingDetailId}:`, err.message || err);
                    return of({
                      statusCode: 404,
                      message: `Kiểm tra chi tiết tòa nhà hết thời gian chờ`,
                      isTimeout: true
                    });
                  })
                )
            );

            if (!buildingResponse ||
              buildingResponse.statusCode !== 200 ||
              !buildingResponse.data ||
              buildingResponse.isTimeout) {
              logger.error(`Building detail ID ${buildingDetailId} is invalid`);
              invalidBuildingDetailIds.push(buildingDetailId);
            }
          } catch (error) {
            logger.error(`Unexpected error validating building detail ${buildingDetailId}:`, error);
            invalidBuildingDetailIds.push(buildingDetailId);
          }
        }

        if (invalidBuildingDetailIds.length > 0) {
          throw new RpcException({
            statusCode: 404,
            message: `Các ID chi tiết tòa nhà sau không tồn tại: ${invalidBuildingDetailIds.join(', ')}`,
          });
        }
      } catch (error) {
        if (error instanceof RpcException) throw error;
        throw new RpcException({
          statusCode: 500,
          message: `Lỗi khi xác thực ID chi tiết tòa nhà: ${error.message}`,
        });
      }

      // Process each cycle config
      const createdSchedules = [];
      const allCreatedJobs = [];

      for (const cycleConfig of cycle_configs) {
        try {
          // Validate maintenance cycle
          const maintenanceCycle = await this.prisma.maintenanceCycle.findUnique({
            where: { cycle_id: cycleConfig.cycle_id }
          });

          if (!maintenanceCycle) {
            logger.error(`Maintenance cycle with ID ${cycleConfig.cycle_id} not found`);
            throw new RpcException({
              statusCode: 404,
              message: `Chu kỳ bảo trì với ID ${cycleConfig.cycle_id} không tìm thấy`,
            });
          }

          // Set default values if not provided
          const startDate = new Date(cycleConfig.start_date || new Date());
          const durationDays = cycleConfig.duration_days || this.getDefaultDurationByFrequency(maintenanceCycle.frequency);
          const autoCreateTasks = cycleConfig.auto_create_tasks !== undefined ? cycleConfig.auto_create_tasks : true;

          // Calculate end date based on duration
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + durationDays);

          logger.log(`Creating schedule for cycle ${maintenanceCycle.device_type} with duration ${durationDays} days`);

          // Get Vietnamese translations
          const deviceTypeVi = this.translateDeviceTypeToVietnamese(maintenanceCycle.device_type);
          const frequencyVi = this.translateFrequencyToVietnamese(maintenanceCycle.frequency);

          // Create the schedule with Vietnamese name and description
          const schedule = await this.prisma.schedule.create({
            data: {
              schedule_name: `Bảo trì ${deviceTypeVi} - ${startDate.toISOString().slice(0, 10)}`,
              description: `Lịch bảo trì ${frequencyVi} được tạo cho ${deviceTypeVi}`,
              cycle_id: maintenanceCycle.cycle_id,
              start_date: startDate,
              end_date: endDate,
              schedule_status: $Enums.ScheduleStatus.InProgress,
              managerid: configDto.managerId, // Add manager ID from the DTO
            },
          });

          logger.log(`Created schedule with ID: ${schedule.schedule_id}`);

          // Create schedule jobs - UPDATED LOGIC
          const scheduleJobs = [];
          const totalBuildings = buildingDetails.length;

          // Create jobs for each building with simple +1 day increment for runDate
          buildingDetails.forEach((buildingDetailId, buildingIndex) => {
            // Calculate runDate by adding 1 day per building index
            const runDate = new Date(startDate);
            runDate.setDate(runDate.getDate() + buildingIndex);

            // Get the latest valid runDate (one day before endDate)
            const latestValidRunDate = new Date(endDate);
            latestValidRunDate.setDate(latestValidRunDate.getDate() - 1);

            // Check if runDate exceeds or equals the latestValidRunDate
            const finalRunDate = runDate >= latestValidRunDate ? new Date(latestValidRunDate) : runDate;

            // All scheduleJobs share the same startDate and endDate as the schedule
            scheduleJobs.push({
              schedule_id: schedule.schedule_id,
              run_date: finalRunDate,
              status: $Enums.ScheduleJobStatus.Pending,
              buildingDetailId: buildingDetailId,
              start_date: startDate, // Same as schedule startDate
              end_date: endDate      // Same as schedule endDate
            });

            logger.log(`Created job for building ${buildingDetailId} with runDate: ${finalRunDate.toISOString()} (original calculated: ${runDate.toISOString()})`);
          });

          if (scheduleJobs.length > 0) {
            // Create schedule jobs in the database
            await this.prisma.scheduleJob.createMany({
              data: scheduleJobs,
            });

            // Retrieve the created jobs with full details
            const createdScheduleJobs = await this.prisma.scheduleJob.findMany({
              where: {
                schedule_id: schedule.schedule_id
              },
              include: {
                schedule: true,
              },
            });

            // If auto create tasks is enabled, add to list for task creation
            if (autoCreateTasks) {
              allCreatedJobs.push(...createdScheduleJobs);
              logger.log(`Added ${createdScheduleJobs.length} jobs for task creation`);
            }

            createdSchedules.push({
              schedule,
              maintenanceCycle,
              jobsCount: createdScheduleJobs.length,
              autoCreateTasks
            });
          }
        } catch (error) {
          if (error instanceof RpcException) {
            logger.error(`Error processing cycle ${cycleConfig.cycle_id}: ${error.message}`);
            // Continue with next cycle instead of failing completely
            continue;
          }
          logger.error(`Unexpected error processing cycle ${cycleConfig.cycle_id}:`, error);
        }
      }

      // Create tasks for jobs if specified and if any jobs were created
      if (allCreatedJobs.length > 0) {
        try {
          logger.log(`Creating tasks for ${allCreatedJobs.length} schedule jobs`);
          await this.createTasksForScheduleJobs(allCreatedJobs);
          logger.log('Successfully created tasks for schedule jobs');
        } catch (taskError) {
          logger.error(`Error creating tasks for schedule jobs: ${taskError.message}`);
        }
      }

      // Send notifications about created schedules
      if (createdSchedules.length > 0) {
        try {
          // Get building names for notification
          const buildingPromises = buildingDetails.map(buildingDetailId =>
            firstValueFrom(
              this.buildingClient
                .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
                .pipe(
                  timeout(10000),
                  catchError(error => of(null))
                )
            )
          );

          const buildingResults = await Promise.all(buildingPromises);
          const buildingNames = buildingResults
            .filter(result => result && result.data)
            .map(result => result.data.name || 'Tòa nhà không tên')
            .join(', ');

          // Create notification for each schedule
          for (const scheduleInfo of createdSchedules) {
            const formattedStartDate = scheduleInfo.schedule.start_date.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            const formattedEndDate = scheduleInfo.schedule.end_date.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            // Translate device type and frequency to Vietnamese
            const deviceTypeVi = this.translateDeviceTypeToVietnamese(scheduleInfo.maintenanceCycle.device_type);
            const frequencyVi = this.translateFrequencyToVietnamese(scheduleInfo.maintenanceCycle.frequency);

            const notificationData = {
              title: `Lịch bảo trì mới đã được tạo cho ${deviceTypeVi}`,
              content: `Lịch bảo trì "${scheduleInfo.schedule.schedule_name}" đã được tạo từ ${formattedStartDate} đến ${formattedEndDate} cho tòa nhà: ${buildingNames}.`,
              type: NotificationType.SYSTEM,
              broadcastToAll: true,
              link: `/schedules/${scheduleInfo.schedule.schedule_id}`,
              relatedId: scheduleInfo.schedule.schedule_id
            };

            await firstValueFrom(
              this.notificationsClient.emit(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION, notificationData)
                .pipe(
                  timeout(10000),
                  catchError(error => of({ success: false }))
                )
            );
          }
        } catch (notifyError) {
          logger.error(`Error sending notifications: ${notifyError.message}`);
          // Continue even if notification fails
        }
      }

      if (createdSchedules.length === 0) {
        return new ApiResponse(
          false,
          'Không thể tạo lịch trình nào. Vui lòng kiểm tra lại tất cả ID chu kỳ và ID chi tiết tòa nhà.',
          null
        );
      }

      return new ApiResponse(
        true,
        `Đã tạo thành công ${createdSchedules.length} lịch trình với ${allCreatedJobs.length} công việc`,
        {
          createdSchedules: createdSchedules.map(s => ({
            schedule_id: s.schedule.schedule_id,
            schedule_name: s.schedule.schedule_name,
            device_type: this.translateDeviceTypeToVietnamese(s.maintenanceCycle.device_type),
            frequency: this.translateFrequencyToVietnamese(s.maintenanceCycle.frequency),
            start_date: s.schedule.start_date,
            end_date: s.schedule.end_date,
            jobs_count: s.jobsCount,
            auto_create_tasks: s.autoCreateTasks
          }))
        }
      );
    } catch (error) {
      console.error('Error generating schedules from config:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: `Không thể tạo lịch trình: ${error.message}`,
      });
    }
  }

  // Helper method to get default duration based on maintenance frequency
  private getDefaultDurationByFrequency(frequency: string): number {
    switch (frequency) {
      case 'Daily': return 1;
      case 'Weekly': return 2;
      case 'Monthly': return 3;
      case 'Yearly': return 5;
      default: return 3;
    }
  }

  // Helper method to translate device types to Vietnamese
  private translateDeviceTypeToVietnamese(deviceType: string): string {
    switch (deviceType) {
      case 'Elevator': return 'thang máy';
      case 'FireProtection': return 'hệ thống phòng cháy chữa cháy';
      case 'Electrical': return 'hệ thống điện';
      case 'Plumbing': return 'hệ thống cấp thoát nước';
      case 'HVAC': return 'hệ thống điều hòa thông gió';
      case 'CCTV': return 'hệ thống camera giám sát';
      case 'Generator': return 'máy phát điện';
      case 'Lighting': return 'hệ thống chiếu sáng';
      case 'AutomaticDoor': return 'cửa tự động';
      case 'FireExtinguisher': return 'bình chữa cháy';
      case 'BuildingStructure': return 'kết cấu tòa nhà';
      case 'Other': return 'thiết bị khác';
      default: return 'thiết bị';
    }
  }

  // Helper method to translate frequency to Vietnamese
  private translateFrequencyToVietnamese(frequency: string): string {
    switch (frequency) {
      case 'Daily': return 'hàng ngày';
      case 'Weekly': return 'hàng tuần';
      case 'Monthly': return 'hàng tháng';
      case 'Quarterly': return 'hàng quý';
      case 'Yearly': return 'hàng năm';
      case 'Specific': return 'cụ thể';
      default: return frequency;
    }
  }

  async getSchedulesByManagerId(
    managerId: string,
    paginationParams?: PaginationParams,
  ): Promise<PaginationResponseDto<ScheduleResponseDto>> {
    try {
      this.logger.log(`Getting schedules for manager ID: ${managerId}`);
      console.time('Total getSchedulesByManagerId execution');

      // Default values if not provided
      const page = Math.max(1, paginationParams?.page || 1);
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10));

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      console.time('Database queries');
      // Get paginated data for schedules with matching manager ID
      const [schedules, total] = await Promise.all([
        this.prisma.schedule.findMany({
          where: {
            managerid: managerId,
          },
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: { scheduleJobs: true },
        }),
        this.prisma.schedule.count({
          where: {
            managerid: managerId,
          },
        }),
      ]);
      console.timeEnd('Database queries');

      console.time('Data transformation');
      // Transform to response DTOs
      const scheduleResponse: ScheduleResponseDto[] = schedules.map(
        (schedule) => ({
          ...schedule,
          start_date: schedule.start_date ? schedule.start_date : null,
          end_date: schedule.end_date ? schedule.end_date : null,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at,
          schedule_job: schedule.scheduleJobs,
        }),
      );
      console.timeEnd('Data transformation');

      console.time('Response creation');
      // Use PaginationResponseDto for consistent response formatting
      const response = new PaginationResponseDto(
        scheduleResponse,
        total,
        page,
        limit,
        200,
        schedules.length > 0
          ? 'Lấy lịch trình thành công'
          : 'Không tìm thấy lịch trình cho quản lý này',
      );
      console.timeEnd('Response creation');

      console.timeEnd('Total getSchedulesByManagerId execution');
      return response;
    } catch (error) {
      this.logger.error(`Error retrieving schedules for manager: ${error.message}`, error.stack);
      throw new RpcException({
        statusCode: 500,
        message: `Lỗi khi lấy danh sách lịch trình: ${error.message}`,
      });
    }
  }
}
