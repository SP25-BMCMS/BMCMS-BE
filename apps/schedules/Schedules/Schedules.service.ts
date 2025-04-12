import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { ScheduleResponseDto } from '@app/contracts/schedules/Schedule.dto'
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto'
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules'
import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { $Enums, PrismaClient, ScheduleJobStatus } from '@prisma/client-Schedule'
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto'

@Injectable()
export class ScheduleService {
  private prisma = new PrismaClient();

  // Create Schedule
  async createSchedule(
    createScheduleDto: CreateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    const { buildingId, ...scheduleData } = createScheduleDto

    try {
      const newSchedule = await this.prisma.$transaction(async (prisma) => {
        const schedule = await prisma.schedule.create({
          data: {
            ...scheduleData,
            start_date: createScheduleDto.start_date,
            end_date: createScheduleDto.end_date,
          },
        })

        if (buildingId && buildingId.length > 0) {
          const scheduleJobs = buildingId.map((id) => ({
            schedule_id: schedule.schedule_id,
            run_date: new Date(),
            status: ScheduleJobStatus.InProgress, // Use the correct enum value
            building_id: id,
          }))

          await prisma.scheduleJob.createMany({
            data: scheduleJobs,
          })
        }

        return schedule
      })

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Schedule created successfully',
        newSchedule,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Schedule creation failed',
      })
    }
  }
  // Update Schedule
  async updateSchedule(
    schedule_id: string,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    const { buildingId, ...scheduleData } = updateScheduleDto

    try {
      // First check if the schedule exists
      const existingSchedule = await this.prisma.schedule.findUnique({
        where: { schedule_id },
        include: { scheduleJobs: true }, // Include schedule jobs to check existing buildings
      })

      if (!existingSchedule) {
        throw new RpcException({
          statusCode: 404,
          message: `Schedule with ID ${schedule_id} not found`,
        })
      }

      // Check if any of the new building IDs already exist in schedule jobs
      if (buildingId && buildingId.length > 0) {
        const existingBuildingIds = existingSchedule.scheduleJobs.map(job => job.building_id)
        const duplicateBuildingIds = buildingId.filter(id => existingBuildingIds.includes(id))

        if (duplicateBuildingIds.length > 0) {
          // Kiểm tra xem các building đã tồn tại có status là Cancel không
          const existingJobs = existingSchedule.scheduleJobs.filter(job =>
            duplicateBuildingIds.includes(job.building_id)
          )

          // Lọc ra các building có status không phải Cancel
          const activeBuildingIds = existingJobs
            .filter(job => job.status !== ScheduleJobStatus.Cancel)
            .map(job => job.building_id)

          if (activeBuildingIds.length > 0) {
            // Chỉ báo lỗi với các building có status không phải Cancel
            return new ApiResponse<ScheduleResponseDto>(
              false,
              `Schedule already has active jobs for buildings: ${activeBuildingIds.join(', ')}`,
              null
            )
          }

          // Nếu tất cả các building đã tồn tại đều có status là Cancel, tiếp tục xử lý
          console.log(`All duplicate buildings have Cancel status, proceeding with update`)
        }
      }

      const updatedSchedule = await this.prisma.$transaction(async (prisma) => {
        // Update schedule data
        const schedule = await prisma.schedule.update({
          where: { schedule_id },
          data: {
            ...scheduleData,
            start_date: updateScheduleDto.start_date,
            end_date: updateScheduleDto.end_date,
          },
        })

        // If buildingId is empty or null, update all existing schedule jobs to Cancel
        if (!buildingId || buildingId.length === 0) {
          // Thay vì xóa, cập nhật status sang Cancel
          await prisma.scheduleJob.updateMany({
            where: { schedule_id },
            data: { status: ScheduleJobStatus.Cancel },
          })
          console.log(`Updated all schedule jobs to Cancel status for schedule ${schedule_id}`)
        } else {
          // Xử lý các building mới
          const existingBuildingIds = existingSchedule.scheduleJobs.map(job => job.building_id)

          // Tạo danh sách các building cần tạo mới (chưa tồn tại hoặc có tất cả status là Cancel)
          const buildingsToCreate = buildingId.filter(id => {
            const existingJob = existingSchedule.scheduleJobs.find(job => job.building_id === id)
            // Nếu không tồn tại hoặc tất cả các job của building đó đều có status Cancel
            return !existingJob || existingSchedule.scheduleJobs
              .filter(job => job.building_id === id)
              .every(job => job.status === ScheduleJobStatus.Cancel)
          })

          // Tạo schedule jobs mới cho các building chưa tồn tại hoặc có tất cả status là Cancel
          if (buildingsToCreate.length > 0) {
            const scheduleJobs = buildingsToCreate.map((id) => ({
              schedule_id: schedule.schedule_id,
              run_date: new Date(),
              status: ScheduleJobStatus.InProgress,
              building_id: id,
            }))

            await prisma.scheduleJob.createMany({
              data: scheduleJobs,
            })
            console.log(`Created ${scheduleJobs.length} new schedule jobs for schedule ${schedule_id}`)
          }

          // Cập nhật status Cancel cho các building không còn trong danh sách mới
          const buildingsToCancel = existingBuildingIds.filter(id => !buildingId.includes(id))
          if (buildingsToCancel.length > 0) {
            await prisma.scheduleJob.updateMany({
              where: {
                schedule_id,
                building_id: { in: buildingsToCancel }
              },
              data: { status: ScheduleJobStatus.Cancel },
            })
            console.log(`Updated ${buildingsToCancel.length} schedule jobs to Cancel status for schedule ${schedule_id}`)
          }
        }

        return schedule
      })

      // Convert Prisma response to ScheduleResponseDto
      const scheduleResponse: ScheduleResponseDto = {
        ...updatedSchedule,
        start_date: updatedSchedule.start_date ? updatedSchedule.start_date : null,
        end_date: updatedSchedule.end_date ? updatedSchedule.end_date : null,
        created_at: updatedSchedule.created_at,
        updated_at: updatedSchedule.updated_at,
      }

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Schedule updated successfully',
        scheduleResponse,
      )
    } catch (error) {
      console.error('Schedule update error:', error)

      // Provide more specific error messages based on the error type
      if (error.code === 'P2025') {
        return new ApiResponse<ScheduleResponseDto>(
          false,
          `Schedule with ID ${schedule_id} not found`,
          null
        )
      } else if (error.code === 'P2002') {
        return new ApiResponse<ScheduleResponseDto>(
          false,
          'A schedule with this name already exists',
          null
        )
      } else if (error.code === 'P2003') {
        return new ApiResponse<ScheduleResponseDto>(
          false,
          'Foreign key constraint violation. Check if all building IDs exist.',
          null
        )
      } else if (error instanceof RpcException) {
        // Chuyển đổi RpcException thành ApiResponse
        return new ApiResponse<ScheduleResponseDto>(
          false,
          error.message,
          null
        )
      } else {
        return new ApiResponse<ScheduleResponseDto>(
          false,
          `Schedule update failed: ${error.message}`,
          null
        )
      }
    }
  }

  // Change Schedule Type
  async changeScheduleType(
    schedule_id: string,
    schedule_type: $Enums.Frequency,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      const updatedSchedule = await this.prisma.schedule.update({
        where: { schedule_id },
        data: {
          schedule_type,
        },
      })

      // Convert Prisma response to ScheduleResponseDto
      const scheduleResponse: ScheduleResponseDto = {
        ...updatedSchedule,
        start_date: updatedSchedule.start_date
          ? updatedSchedule.start_date
          : null,
        end_date: updatedSchedule.end_date ? updatedSchedule.end_date : null,
        created_at: updatedSchedule.created_at,
        updated_at: updatedSchedule.updated_at,
      }

      return new ApiResponse<ScheduleResponseDto>(
        true,
        'Schedule type updated successfully',
        scheduleResponse,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Change schedule type failed',
      })
    }
  }

  // Get all schedules
  async getAllSchedules(
    paginationParams?: PaginationParams,
  ): Promise<PaginationResponseDto<ScheduleResponseDto>> {
    try {
      // Default values if not provided
      const page = Math.max(1, paginationParams?.page || 1)
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10))

      // Calculate skip value for pagination
      const skip = (page - 1) * limit

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

      // Use PaginationResponseDto for consistent response formatting
      return new PaginationResponseDto(
        scheduleResponse,
        total,
        page,
        limit,
        200,
        schedules.length > 0
          ? 'Schedules retrieved successfully'
          : 'No schedules found',
      )
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
}
