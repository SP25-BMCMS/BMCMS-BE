import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { ScheduleResponseDto } from '@app/contracts/schedules/Schedule.dto'
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto'
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules'
import { Injectable, Inject, Logger } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { $Enums, PrismaClient, ScheduleJobStatus } from '@prisma/client-schedule'
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto'
import { AutoMaintenanceScheduleDto } from '@app/contracts/schedules/auto-maintenance-schedule.dto'
import { ClientProxy } from '@nestjs/microservices'
import { TASKS_PATTERN } from '@app/contracts/tasks/task.patterns'
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns'
import { firstValueFrom, catchError, retry, throwError, of, Observable, lastValueFrom } from 'rxjs'
import { timeout } from 'rxjs/operators'
import { BUILDINGDETAIL_PATTERN } from '@app/contracts/BuildingDetails/buildingdetails.patterns'

// Định nghĩa constants cho microservice clients
const TASK_CLIENT = 'TASK_CLIENT'
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'

// Các giá trị timeout tối ưu hơn
const MICROSERVICE_TIMEOUT = 10000; // 10 seconds
const TASK_CREATION_TIMEOUT = 20000; // 20 seconds
const MAX_RETRY_ATTEMPTS = 3;

// Định nghĩa task status
enum TaskStatus {
  PENDING = 'Pending',
  CREATED = 'Created',
  FAILED = 'Failed'
}

// Phần bổ sung: Task Queue để xử lý bất đồng bộ
interface TaskQueueItem {
  scheduleJobId: string;
  attempt: number;
  lastAttempt: Date;
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
          ? 'Schedules retrieved successfully'
          : 'No schedules found',
      )
      console.timeEnd('Response creation')

      console.timeEnd('Total getAllSchedules execution')
      return response
    } catch (error) {
      console.error('Error retrieving schedules:', error)
      throw new RpcException({
        statusCode: 500,
        message: `Error retrieving schedules: ${error.message}`,
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
          message: 'Schedule not found',
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
        'Schedule fetched successfully',
        scheduleResponse,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving schedule',
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
          `Schedule with ID ${schedule_id} not found`,
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
        'Schedule and all related jobs have been soft deleted (status set to Cancel)',
        scheduleResponse
      )
    } catch (error) {
      console.error('Error in deleteSchedule:', error)
      return new ApiResponse<ScheduleResponseDto>(
        false,
        `Failed to soft delete schedule: ${error.message}`,
        null
      )
    }
  }

  // Phương thức để tạo task và task assignment tự động cho các schedule jobs
  async createTasksForScheduleJobs(scheduleJobs: any[]): Promise<void> {
    const logger = new Logger('CreateTasksForScheduleJobs');

    for (const [index, job] of scheduleJobs.entries()) {
      try {

        const createTaskResponse = await firstValueFrom(
          this.taskClient.send({ cmd: 'create-task-for-schedule-job' }, {
            scheduleJobId: job.schedule_job_id
          }).pipe(
            timeout(TASK_CREATION_TIMEOUT),
            catchError(err => {
              return of({
                isSuccess: false,
                message: err.message || 'Unknown error',
                data: null
              });
            })
          )
        );

      } catch (error) {
      }
    }
  }

  // Cập nhật method createAutoMaintenanceSchedule để tạo tasks tự động
  async createAutoMaintenanceSchedule(
    dto: AutoMaintenanceScheduleDto
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      // 1. First, get the maintenance cycle to understand the frequency
      const maintenanceCycle = await this.prisma.maintenanceCycle.findUnique({
        where: { cycle_id: dto.cycle_id }
      });

      if (!maintenanceCycle) {
        throw new RpcException({
          statusCode: 404,
          message: `Maintenance cycle with ID ${dto.cycle_id} not found`,
        });
      }

      // Validate all building detail IDs exist before proceeding
      if (dto.buildingDetailIds && dto.buildingDetailIds.length > 0) {
        try {
          const invalidBuildingDetailIds = [];

          for (const buildingDetailId of dto.buildingDetailIds) {
            try {
              console.log(`Validating building detail ID: ${buildingDetailId}`);

              // Use a longer timeout and proper error handling
              const buildingResponse = await firstValueFrom(
                this.buildingClient
                  .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
                  .pipe(
                    timeout(15000),  // Increase timeout to 15 seconds
                    catchError(err => {
                      console.error(`Error checking building detail ${buildingDetailId}:`, err.message || err);
                      // For timeout errors, return a structured response rather than throwing
                      return of({
                        statusCode: 404,
                        message: `Building detail check timed out`,
                        isTimeout: true
                      });
                    })
                  )
              );

              // Proper validation of the response
              console.log(`Building detail response for ${buildingDetailId}:`,
                typeof buildingResponse === 'object' ?
                  `statusCode=${buildingResponse.statusCode}, message=${buildingResponse.message}` :
                  'invalid response format');

              // Only consider a building detail valid if we get a 200 response with data
              if (!buildingResponse ||
                buildingResponse.statusCode !== 200 ||
                !buildingResponse.data ||
                buildingResponse.isTimeout) {
                console.log(`Building detail ID ${buildingDetailId} is invalid. Adding to invalid list.`);
                invalidBuildingDetailIds.push(buildingDetailId);
              } else {
                console.log(`Building detail ID ${buildingDetailId} validated successfully`);
              }
            } catch (error) {
              // Any unexpected error means we couldn't validate the building detail
              console.error(`Unexpected error validating building detail ${buildingDetailId}:`, error);
              invalidBuildingDetailIds.push(buildingDetailId);
            }
          }

          // If any building details are invalid, throw a 404 exception
          if (invalidBuildingDetailIds.length > 0) {
            console.error(`Found ${invalidBuildingDetailIds.length} invalid building detail IDs:`, invalidBuildingDetailIds);
            throw new RpcException({
              statusCode: 404,
              message: `The following building detail IDs do not exist: ${invalidBuildingDetailIds.join(', ')}`,
            });
          }

          console.log('All building detail IDs validated successfully');
        } catch (error) {
          // Rethrow RPC exceptions
          if (error instanceof RpcException) {
            throw error;
          }

          // For any other errors in the validation process, throw a generic error
          console.error('Error validating building detail IDs:', error);
          throw new RpcException({
            statusCode: 500,
            message: `Error validating building detail IDs: ${error.message}`,
          });
        }
      }

      // 2. Calculate dates based on maintenance cycle frequency
      const now = new Date();
      let startDate = dto.start_date ? new Date(dto.start_date) : now;
      let endDate: Date | null = null;

      if (dto.end_date) {
        endDate = new Date(dto.end_date);
      } else {
        // Set default end date based on cycle frequency if not provided
        endDate = new Date(startDate);
        switch (maintenanceCycle.frequency) {
          case 'Daily':
            endDate.setDate(endDate.getDate() + 30); // 30 days for daily
            break;
          case 'Weekly':
            endDate.setDate(endDate.getDate() + 90); // ~3 months for weekly
            break;
          case 'Monthly':
            endDate.setFullYear(endDate.getFullYear() + 1); // 1 year for monthly
            break;
          case 'Yearly':
            endDate.setFullYear(endDate.getFullYear() + 3); // 3 years for yearly
            break;
          default:
            endDate.setFullYear(endDate.getFullYear() + 1); // Default to 1 year
        }
      }

      // 3. Create the schedule
      const newSchedule = await this.prisma.$transaction(async (prisma) => {
        // Create the main schedule
        const schedule = await prisma.schedule.create({
          data: {
            schedule_name: dto.schedule_name,
            description: dto.description || `Auto-generated maintenance schedule for ${maintenanceCycle.device_type}`,
            cycle_id: dto.cycle_id,
            start_date: startDate,
            end_date: endDate,
            schedule_status: $Enums.ScheduleStatus.InProgress,
          },
        });

        // Calculate the first maintenance date for each building
        const createdJobs = [];
        if (dto.buildingDetailIds && dto.buildingDetailIds.length > 0) {
          // Calculate the run date based on frequency
          const calcRunDate = (baseDate: Date, frequency: string): Date => {
            const result = new Date(baseDate);
            switch (frequency) {
              case 'Daily':
                result.setDate(result.getDate() + 1);
                break;
              case 'Weekly':
                result.setDate(result.getDate() + 7);
                break;
              case 'Monthly':
                result.setMonth(result.getMonth() + 1);
                break;
              case 'Yearly':
                result.setFullYear(result.getFullYear() + 1);
                break;
              default:
                result.setMonth(result.getMonth() + 1); // Default to monthly
            }
            return result;
          };

          // Create schedule jobs for each building
          const scheduleJobs = dto.buildingDetailIds.map((buildingDetailId) => ({
            schedule_id: schedule.schedule_id,
            run_date: calcRunDate(startDate, maintenanceCycle.frequency),
            status: $Enums.ScheduleJobStatus.InProgress,
            buildingDetailId: buildingDetailId,
          }));

          // Create schedule jobs
          const createdJobsResult = await prisma.scheduleJob.createMany({
            data: scheduleJobs,
          });

          // Lấy thông tin đầy đủ của các jobs vừa tạo
          const fullScheduleJobs = await prisma.scheduleJob.findMany({
            where: {
              schedule_id: schedule.schedule_id,
            },
            include: {
              schedule: true,
            },
          });

          createdJobs.push(...fullScheduleJobs);
        }

        return { schedule, createdJobs };
      });

      // Tạo tasks cho mỗi job đã tạo
      if (newSchedule.createdJobs && newSchedule.createdJobs.length > 0) {
        // Tạo task và task assignment cho mỗi job
        await this.createTasksForScheduleJobs(newSchedule.createdJobs);
      }

      // Return the newly created schedule
      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Automated maintenance schedule created successfully',
        {
          ...newSchedule.schedule,
          start_date: newSchedule.schedule.start_date,
          end_date: newSchedule.schedule.end_date,
          created_at: newSchedule.schedule.created_at,
          updated_at: newSchedule.schedule.updated_at,
        }
      );
    } catch (error) {
      console.error('Error creating automated maintenance schedule:', error);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: `Failed to create automated maintenance schedule: ${error.message}`,
      });
    }
  }

  // Cập nhật method triggerAutoMaintenanceSchedule để tạo tasks tự động
  async triggerAutoMaintenanceSchedule(): Promise<ApiResponse<string>> {
    try {
      // Lấy tất cả các MaintenanceCycle
      const maintenanceCycles = await this.prisma.maintenanceCycle.findMany();

      if (!maintenanceCycles || maintenanceCycles.length === 0) {
        throw new RpcException({
          statusCode: 404,
          message: 'No maintenance cycles found to create schedules',
        });
      }

      // Lấy tất cả các tòa nhà
      const buildings: { buildingDetailId: string }[] = await this.prisma.$queryRaw`
        SELECT DISTINCT "buildingDetailId" FROM "ScheduleJob"
      `;

      if (!buildings || buildings.length === 0) {
        throw new RpcException({
          statusCode: 404,
          message: 'No buildings found to create maintenance schedules',
        });
      }

      // Số lượng lịch được tạo
      let createdSchedulesCount = 0;

      // Lưu lại các jobs đã tạo để tạo task
      const allCreatedJobs = [];

      // Duyệt qua từng cycle để tạo lịch bảo trì
      for (const cycle of maintenanceCycles) {
        // Tính toán ngày bắt đầu và kết thúc dựa trên tần suất
        const now = new Date();
        let endDate = new Date(now);

        switch (cycle.frequency) {
          case 'Daily':
            endDate.setDate(endDate.getDate() + 30);
            break;
          case 'Weekly':
            endDate.setDate(endDate.getDate() + 90);
            break;
          case 'Monthly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
          case 'Yearly':
            endDate.setFullYear(endDate.getFullYear() + 3);
            break;
          default:
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        try {
          // Tạo một lịch bảo trì mới
          const schedule = await this.prisma.schedule.create({
            data: {
              schedule_name: `Auto ${cycle.device_type} Maintenance - ${now.toISOString().slice(0, 10)}`,
              description: `Automatically generated maintenance schedule for ${cycle.device_type}`,
              cycle_id: cycle.cycle_id,
              start_date: now,
              end_date: endDate,
              schedule_status: $Enums.ScheduleStatus.InProgress,
            },
          });

          // Tạo các ScheduleJob cho mỗi tòa nhà
          const buildingDetailIds = buildings.map(b => b.buildingDetailId);

          // Calcular run date dựa trên tần suất
          const calcRunDate = (baseDate: Date, frequency: string): Date => {
            const result = new Date(baseDate);
            switch (frequency) {
              case 'Daily':
                result.setDate(result.getDate() + 1);
                break;
              case 'Weekly':
                result.setDate(result.getDate() + 7);
                break;
              case 'Monthly':
                result.setMonth(result.getMonth() + 1);
                break;
              case 'Yearly':
                result.setFullYear(result.getFullYear() + 1);
                break;
              default:
                result.setMonth(result.getMonth() + 1); // Default to monthly
            }
            return result;
          };

          // Tạo các job cho mỗi tòa nhà
          const scheduleJobs = buildingDetailIds.map(buildingDetailId => ({
            schedule_id: schedule.schedule_id,
            run_date: calcRunDate(now, cycle.frequency),
            status: $Enums.ScheduleJobStatus.Pending,
            buildingDetailId: buildingDetailId,
          }));

          // Thêm các công việc bảo trì vào DB
          await this.prisma.scheduleJob.createMany({
            data: scheduleJobs,
          });

          // Lấy thông tin đầy đủ của các jobs vừa tạo
          const fullScheduleJobs = await this.prisma.scheduleJob.findMany({
            where: {
              schedule_id: schedule.schedule_id,
            },
            include: {
              schedule: true,
            },
          });

          // Thêm vào danh sách để tạo task
          allCreatedJobs.push(...fullScheduleJobs);

          createdSchedulesCount++;
        } catch (error) {
          console.error(`Error creating schedule for cycle ${cycle.cycle_id}:`, error);
        }
      }

      // Tạo task và task assignment cho tất cả jobs đã tạo
      if (allCreatedJobs.length > 0) {
        await this.createTasksForScheduleJobs(allCreatedJobs);
      }

      return new ApiResponse<string>(
        true,
        `Successfully created ${createdSchedulesCount} maintenance schedules with task assignments`,
        `Created ${createdSchedulesCount} schedules from ${maintenanceCycles.length} maintenance cycles with ${allCreatedJobs.length} task assignments`
      );
    } catch (error) {
      console.error('Error triggering auto maintenance schedules:', error);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        statusCode: 500,
        message: `Failed to trigger automated maintenance schedules: ${error.message}`,
      });
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
      });

      if (!maintenanceCycle) {
        throw new RpcException({
          statusCode: 404,
          message: `Maintenance cycle with ID ${createScheduleDto.cycle_id} not found`,
        });
      }

      // Validate all building detail IDs exist before proceeding
      if (createScheduleDto.buildingDetailIds && createScheduleDto.buildingDetailIds.length > 0) {
        try {
          const invalidBuildingDetailIds = [];

          for (const buildingDetailId of createScheduleDto.buildingDetailIds) {
            try {
              console.log(`Validating building detail ID: ${buildingDetailId}`);

              // Use a longer timeout and proper error handling
              const buildingResponse = await firstValueFrom(
                this.buildingClient
                  .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
                  .pipe(
                    timeout(15000),  // Increase timeout to 15 seconds
                    catchError(err => {
                      console.error(`Error checking building detail ${buildingDetailId}:`, err.message || err);
                      // For timeout errors, return a structured response rather than throwing
                      return of({
                        statusCode: 404,
                        message: `Building detail check timed out`,
                        isTimeout: true
                      });
                    })
                  )
              );

              // Proper validation of the response
              console.log(`Building detail response for ${buildingDetailId}:`,
                typeof buildingResponse === 'object' ?
                  `statusCode=${buildingResponse.statusCode}, message=${buildingResponse.message}` :
                  'invalid response format');

              // Only consider a building detail valid if we get a 200 response with data
              if (!buildingResponse ||
                buildingResponse.statusCode !== 200 ||
                !buildingResponse.data ||
                buildingResponse.isTimeout) {
                console.log(`Building detail ID ${buildingDetailId} is invalid. Adding to invalid list.`);
                invalidBuildingDetailIds.push(buildingDetailId);
              } else {
                console.log(`Building detail ID ${buildingDetailId} validated successfully`);
              }
            } catch (error) {
              // Any unexpected error means we couldn't validate the building detail
              console.error(`Unexpected error validating building detail ${buildingDetailId}:`, error);
              invalidBuildingDetailIds.push(buildingDetailId);
            }
          }

          // If any building details are invalid, throw a 404 exception
          if (invalidBuildingDetailIds.length > 0) {
            console.error(`Found ${invalidBuildingDetailIds.length} invalid building detail IDs:`, invalidBuildingDetailIds);
            throw new RpcException({
              statusCode: 404,
              message: `The following building detail IDs do not exist: ${invalidBuildingDetailIds.join(', ')}`,
            });
          }

          console.log('All building detail IDs validated successfully');
        } catch (error) {
          // Rethrow RPC exceptions
          if (error instanceof RpcException) {
            throw error;
          }

          // For any other errors in the validation process, throw a generic error
          console.error('Error validating building detail IDs:', error);
          throw new RpcException({
            statusCode: 500,
            message: `Error validating building detail IDs: ${error.message}`,
          });
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
        },
      });

      // Create schedule jobs if building detail IDs are provided
      let scheduleJobs = [];

      if (createScheduleDto.buildingDetailIds && createScheduleDto.buildingDetailIds.length > 0) {
        // Create schedule jobs data
        const scheduleJobsData = createScheduleDto.buildingDetailIds.map(buildingDetailId => ({
          schedule_id: newSchedule.schedule_id,
          run_date: new Date(),
          status: $Enums.ScheduleJobStatus.Pending,
          buildingDetailId: buildingDetailId,
        }));

        // Create jobs
        await this.prisma.scheduleJob.createMany({
          data: scheduleJobsData,
        });

        // Get the created jobs
        scheduleJobs = await this.prisma.scheduleJob.findMany({
          where: { schedule_id: newSchedule.schedule_id },
        });
      }

      // Format the response
      const scheduleResponse: ScheduleResponseDto = {
        ...newSchedule,
        schedule_job: scheduleJobs,
      };

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Schedule created successfully',
        scheduleResponse,
      );
    } catch (error) {
      console.error('Error creating schedule:', error);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        statusCode: 500,
        message: `Failed to create schedule: ${error.message}`,
      });
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
      });

      if (!existingSchedule) {
        throw new RpcException({
          statusCode: 404,
          message: `Schedule with ID ${schedule_id} not found`,
        });
      }

      // Prepare update data
      const updateData: any = {};

      if (updateScheduleDto.schedule_name) updateData.schedule_name = updateScheduleDto.schedule_name;
      if (updateScheduleDto.description !== undefined) updateData.description = updateScheduleDto.description;
      if (updateScheduleDto.start_date) updateData.start_date = new Date(updateScheduleDto.start_date);
      if (updateScheduleDto.end_date) updateData.end_date = new Date(updateScheduleDto.end_date);
      if (updateScheduleDto.schedule_status) updateData.schedule_status = updateScheduleDto.schedule_status;
      if (updateScheduleDto.cycle_id) updateData.cycle_id = updateScheduleDto.cycle_id;

      // Update the schedule
      const updatedSchedule = await this.prisma.schedule.update({
        where: { schedule_id },
        data: updateData,
      });

      // Handle building detail IDs if provided
      if (updateScheduleDto.buildingDetailIds && updateScheduleDto.buildingDetailIds.length > 0) {
        // Create schedule jobs for new building detail IDs
        const scheduleJobsData = updateScheduleDto.buildingDetailIds.map(buildingDetailId => ({
          schedule_id: schedule_id,
          run_date: new Date(),
          status: $Enums.ScheduleJobStatus.Pending,
          buildingDetailId: buildingDetailId,
        }));

        // Create jobs (will ignore duplicates due to unique constraints)
        await this.prisma.scheduleJob.createMany({
          data: scheduleJobsData,
          skipDuplicates: true,
        });
      }

      // Get all schedule jobs
      const scheduleJobs = await this.prisma.scheduleJob.findMany({
        where: { schedule_id },
      });

      // Format the response
      const scheduleResponse: ScheduleResponseDto = {
        ...updatedSchedule,
        schedule_job: scheduleJobs,
      };

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Schedule updated successfully',
        scheduleResponse,
      );
    } catch (error) {
      console.error('Error updating schedule:', error);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        statusCode: 500,
        message: `Failed to update schedule: ${error.message}`,
      });
    }
  }
}
