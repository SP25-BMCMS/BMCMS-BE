import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto'
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto'
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status'
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto'
import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy, RpcException } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import { BUILDINGS_PATTERN } from '../../../libs/contracts/src/buildings/buildings.patterns'
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto'
import { PrismaService } from '../prisma/prisma.service'
import { BUILDINGDETAIL_PATTERN } from '@app/contracts/BuildingDetails/buildingdetails.patterns'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { isUUID } from 'class-validator'

const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT'
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'

@Injectable()
export class ScheduleJobsService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(BUILDINGS_CLIENT) private readonly buildingClient: ClientProxy,
    @Inject(NOTIFICATION_CLIENT) private readonly notificationsClient: ClientProxy,
  ) { }

  // Create a new Schedule Job
  async createScheduleJob(
    createScheduleJobDto: CreateScheduleJobDto,
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      const validScheduleId = isUUID(createScheduleJobDto.schedule_id)
      ? createScheduleJobDto.schedule_id
      : null;

      const newScheduleJob = await this.prismaService.scheduleJob.create({
        data: {
          schedule_id: validScheduleId,
          run_date: createScheduleJobDto.run_date,
          status: createScheduleJobDto.status,
          buildingDetailId: createScheduleJobDto.buildingDetailId,
          inspection_id: createScheduleJobDto.inspectionId,
        },
      })
      // Map buildingDetailId to building_id to match ScheduleJobResponseDto
      const responseDto: ScheduleJobResponseDto = {
        ...newScheduleJob,
        building_id: newScheduleJob.buildingDetailId,
      }
      return new ApiResponse<ScheduleJobResponseDto>(
        true,
        'Schedule job created successfully',
        responseDto,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: error.message,
      })
    }
  }

  // Get all Schedule Jobs
  async getAllScheduleJobs(
    paginationParams?: PaginationParams,
  ): Promise<PaginationResponseDto<ScheduleJobResponseDto>> {
    try {
      // Default values if not provided
      const page = Math.max(1, paginationParams?.page || 1)
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10))

      // Calculate skip value for pagination
      const skip = (page - 1) * limit

      // Get total count for pagination metadata
      const total = await this.prismaService.scheduleJob.count()

      // If no schedule jobs found at all
      if (total === 0) {
        return new PaginationResponseDto(
          [],
          0,
          page,
          limit,
          404,
          'No schedule jobs found',
        )
      }

      // Get paginated data
      const scheduleJobs = await this.prismaService.scheduleJob.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      })

      // Map each scheduleJob to include building_id
      const mappedJobs: ScheduleJobResponseDto[] = scheduleJobs.map(job => ({
        ...job,
        building_id: job.buildingDetailId,
      }))

      // Use PaginationResponseDto for consistent response formatting
      return new PaginationResponseDto(
        mappedJobs,
        total,
        page,
        limit,
        200,
        scheduleJobs.length > 0
          ? 'Schedule jobs fetched successfully'
          : 'No schedule jobs found for this page',
      )
    } catch (error) {
      console.error('Error retrieving schedule jobs:', error)
      throw new RpcException({
        statusCode: 500,
        message: `Error retrieving schedule jobs: ${error.message}`,
      })
    }
  }

  // Get Schedule Job by ID
  async getScheduleJobById(
    schedule_job_id: string,
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      const scheduleJob = await this.prismaService.scheduleJob.findUnique({
        where: { schedule_job_id },
      })
      if (!scheduleJob) {
        throw new RpcException({
          statusCode: 404,
          mescsage: 'Shedule job not found',
        })
      }

      const responseDto: ScheduleJobResponseDto = {
        ...scheduleJob,
        building_id: scheduleJob.buildingDetailId,
      }

      return new ApiResponse<ScheduleJobResponseDto>(
        true,
        'Schedule job fetched successfully',
        responseDto,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving schedule job by IDD',
      })
    }
  }

  // Update Schedule Job Status
  async updateScheduleJobStatus(
    updateScheduleJobStatusDto: UpdateScheduleJobStatusDto,
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      const { schedule_job_id, status } = updateScheduleJobStatusDto

      const updatedScheduleJob = await this.prismaService.scheduleJob.update({
        where: { schedule_job_id },
        data: {
          status,
        },
      })

      const responseDto: ScheduleJobResponseDto = {
        ...updatedScheduleJob,
        building_id: updatedScheduleJob.buildingDetailId,
      }

      return new ApiResponse<ScheduleJobResponseDto>(
        true,
        'Schedule job status updated successfully',
        responseDto,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Schedule job status update failed',
      })
    }
  }
  async updateScheduleJob(
    schedule_job_id: string,
    updateData: Partial<UpdateScheduleJobDto>, // Partial allows updating only the fields provided
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      // Try to update the schedule job with the given data
      const updatedScheduleJob = await this.prismaService.scheduleJob.update({
        where: { schedule_job_id },
        data: {
          schedule_id: updateData.schedule_id, // Nếu có, cập nhật schedule_id
          run_date: updateData.run_date, // Nếu có, cập nhật run_date
          status: updateData.status, // Nếu có, cập nhật status
          // Map building_id to buildingDetailId in the database
          buildingDetailId: updateData.building_id,
        },
      })

      const responseDto: ScheduleJobResponseDto = {
        ...updatedScheduleJob,
        building_id: updatedScheduleJob.buildingDetailId,
      }

      return new ApiResponse<ScheduleJobResponseDto>(
        true,
        'Schedule job updated successfully',
        responseDto,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Schedule job update failed' + error.message,
      })
    }
  }

  async getScheduleJobsByScheduleId(scheduleId: string, paginationParams: PaginationParams) {
    const { page = 1, limit = 10 } = paginationParams
    const skip = (page - 1) * limit

    try {
      // Get schedule jobs with pagination
      const [scheduleJobs, total] = await Promise.all([
        this.prismaService.scheduleJob.findMany({
          where: { schedule_id: scheduleId },
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            schedule: true, // Include schedule information
          },
        }),
        this.prismaService.scheduleJob.count({
          where: { schedule_id: scheduleId },
        }),
      ])

      // Get building information for each schedule job
      const scheduleJobsWithBuildings = await Promise.all(
        scheduleJobs.map(async (job) => {
          try {
            // Kiểm tra xem buildingDetailId có tồn tại không
            if (!job.buildingDetailId) {
              console.warn(`Schedule job ${job.schedule_job_id} has no buildingDetailId`)
              return {
                ...job,
                building: null,
                building_id: job.buildingDetailId,
              }
            }

            console.log(`Fetching building with ID: ${job.buildingDetailId}`)
            const building = await firstValueFrom(
              this.buildingClient.send(BUILDINGS_PATTERN.GET_BY_ID, { buildingId: job.buildingDetailId })
            )
            console.log(`Building response:`, building)
            return {
              ...job,
              building: building.data,
              building_id: job.buildingDetailId,
            }
          } catch (error) {
            console.error(`Error fetching building for job ${job.schedule_job_id}:`, error)
            return {
              ...job,
              building: null,
              building_id: job.buildingDetailId,
            }
          }
        })
      )

      return {
        statusCode: 200,
        message: 'Schedule jobs retrieved successfully',
        data: scheduleJobsWithBuildings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error('Error getting schedule jobs by schedule ID:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to get schedule jobs: ' + error.message,
      })
    }
  }

  async sendMaintenanceEmail(scheduleJobId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!scheduleJobId) {
        return new ApiResponse(false, 'Schedule job ID is required', null)
      }

      console.log(`Fetching schedule job with ID: ${scheduleJobId}`)
      // Get schedule job details
      const scheduleJob = await this.prismaService.scheduleJob.findUnique({
        where: { schedule_job_id: scheduleJobId },
        include: {
          schedule: true,
        },
      })

      if (!scheduleJob) {
        console.error(`Schedule job not found with ID: ${scheduleJobId}`)
        return new ApiResponse(false, 'Schedule job not found', null)
      }

      console.log(`Fetching building with ID: ${scheduleJob.buildingDetailId}`)
      // Get building details
      const buildingResponse = await firstValueFrom(
        this.buildingClient.send(BUILDINGS_PATTERN.GET_BY_ID, { buildingId: scheduleJob.buildingDetailId })
      )

      if (!buildingResponse || !buildingResponse.data) {
        console.error(`Building not found with ID: ${scheduleJob.buildingDetailId}`)
        return new ApiResponse(false, 'Building not found', null)
      }

      const building = buildingResponse.data
      console.log(`Building details:`, {
        name: building.name,
        description: building.description,
        numberFloor: building.numberFloor,
        area: building.area,
        buildingDetails: building.buildingDetails
      })

      // Get building details with location information
      const buildingDetailsResponse = await firstValueFrom(
        this.buildingClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, {
          buildingDetailId: building.buildingDetails?.[0]?.buildingDetailId
        })
      )

      console.log(`Fetching residents for building ID: ${scheduleJob.buildingDetailId}`)
      // Get residents for the building
      const residentsResponse = await firstValueFrom(
        this.buildingClient.send(BUILDINGS_PATTERN.GET_RESIDENTS_BY_BUILDING_ID, building.buildingId)
      )

      console.log(`Found ${residentsResponse.data.length} residents to send emails to`)
      // Send email to each resident using notifications service
      const emailPromises = residentsResponse.data.map(resident => {
        if (!resident.email) {
          console.log(`Skipping resident ${resident.name} - no email address`)
          return Promise.resolve()
        }

        // Get location details for the resident
        const locationDetails = buildingDetailsResponse?.data?.locationDetails?.find(
          loc => loc.roomNumber === resident.apartmentNumber
        )

        console.log(`Sending email to resident: ${resident.name} (${resident.email})`)
        return firstValueFrom(
          this.notificationsClient.emit(NOTIFICATIONS_PATTERN.SEND_MAINTENANCE_SCHEDULE_EMAIL, {
            to: resident.email,
            residentName: resident.name,
            buildingName: building.name,
            maintenanceDate: scheduleJob.run_date,
            startTime: '08:00', // Default start time
            endTime: '17:00', // Default end time
            maintenanceType: scheduleJob.schedule.schedule_name,
            description: scheduleJob.schedule.description || 'No additional details provided',
            floor: locationDetails?.floorNumber?.toString() || building.numberFloor?.toString() || 'Không xác định',
            area: building.area?.name || 'Không xác định',
            unit: locationDetails?.roomNumber || resident.apartmentNumber || 'Không xác định'
          })
        )
      })

      await Promise.all(emailPromises)
      console.log('All maintenance schedule emails sent successfully')

      return new ApiResponse(
        true,
        'Maintenance schedule emails sent successfully',
        { message: `Emails sent to ${residentsResponse.data.length} residents` }
      )
    } catch (error) {
      console.error('Error sending maintenance emails:', error)
      return new ApiResponse(
        false,
        `Failed to send maintenance schedule emails: ${error.message}`,
        null
      )
    }
  }
}
