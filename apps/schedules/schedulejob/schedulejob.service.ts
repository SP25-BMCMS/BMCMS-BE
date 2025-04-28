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
        'Tạo công việc lịch trình thành công',
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
          'Không tìm thấy công việc lịch trình nào',
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
          ? 'Lấy danh sách công việc lịch trình thành công'
          : 'Không tìm thấy công việc lịch trình nào cho trang này',
      )
    } catch (error) {
      console.error('Error retrieving schedule jobs:', error)
      throw new RpcException({
        statusCode: 500,
        message: `Lỗi khi lấy danh sách công việc lịch trình: ${error.message}`,
      })
    }
  }

  // Get Schedule Job by ID
  async getScheduleJobById(
    schedule_job_id: string,
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      console.log('schedule_job_idschedule_job_idschedule_job_idschedule_job_idschedule_job_idschedule_job_idschedule_job_id', schedule_job_id)
      const scheduleJob = await this.prismaService.scheduleJob.findUnique({
        where: { schedule_job_id },
        include: {
          schedule: {
            include: {
              cycle: true
            }
          }
        },
      })
      if (!scheduleJob) {
        throw new RpcException({
          statusCode: 404,
          mescsage: 'Không tìm thấy công việc lịch trình',
        })
      }

      // Get building detail information if buildingDetailId exists
      let buildingDetail = null;
      if (scheduleJob.buildingDetailId) {
        try {
          buildingDetail = await firstValueFrom(
            this.buildingClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, {
              buildingDetailId: scheduleJob.buildingDetailId,
            })
          );
        } catch (error) {
          console.error('Error fetching building detail:', error);
          // Continue without building detail if there's an error
        }
      }

      const responseDto: ScheduleJobResponseDto = {
        ...scheduleJob,
        building_id: scheduleJob.buildingDetailId,
        buildingDetail: buildingDetail?.data || null
      }

      return new ApiResponse<ScheduleJobResponseDto>(
        true,
        'Lấy thông tin công việc lịch trình thành công',
        responseDto,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy thông tin công việc lịch trình theo ID',
      })
    }
  }

  // Update Schedule Job Status
  async updateScheduleJobStatus(
    updateScheduleJobStatusDto: UpdateScheduleJobStatusDto,
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      console.log('🚀 ~ ScheduleJobsService ~ updateScheduleJobStatus ~ updateScheduleJobStatusDto:', updateScheduleJobStatusDto)
      const { schedulejobs_id, status } = updateScheduleJobStatusDto
      console.log('🚀 ~ ScheduleJobsService ~ updateScheduleJobStatus ~ schedulejobs_id:', updateScheduleJobStatusDto.schedulejobs_id)
      console.log('🚀 ~ ScheduleJobsService ~ updateScheduleJobStatus ~ status:', updateScheduleJobStatusDto.status)

      const updatedScheduleJob = await this.prismaService.scheduleJob.update({
        where: { schedule_job_id: schedulejobs_id },
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
        'Cập nhật trạng thái công việc lịch trình thành công',
        responseDto,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Cập nhật trạng thái công việc lịch trình thất bại',
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
        'Cập nhật công việc lịch trình thành công',
        responseDto,
      )
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Cập nhật công việc lịch trình thất bại: ' + error.message,
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
            // Get building detail information if buildingDetailId exists
            let buildingDetail = null;
            if (job.buildingDetailId) {
              try {
                buildingDetail = await firstValueFrom(
                  this.buildingClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, {
                    buildingDetailId: job.buildingDetailId,
                  })
                );
              } catch (error) {
                console.error('Error fetching building detail:', error);
                // Continue without building detail if there's an error
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
              buildingDetail: buildingDetail?.data || null,

            }
          } catch (error) {
            console.error(`Error fetching building for job ${job.schedule_job_id}:`, error)
            return {
              ...job,
              building: null,
              building_id: job.buildingDetailId,
              //buildingDetail: buildingDetail?.data || null,

            }
          }
        })
      )

      return {
        statusCode: 200,
        message: 'Lấy danh sách công việc lịch trình thành công',
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
        message: 'Không thể lấy danh sách công việc lịch trình: ' + error.message,
      })
    }
  }

  async sendMaintenanceEmail(scheduleJobId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!scheduleJobId) {
        return new ApiResponse(false, 'Cần ID công việc lịch trình', null)
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
        return new ApiResponse(false, 'Không tìm thấy công việc lịch trình', null)
      }

      console.log(`Fetching building detail with ID: ${scheduleJob.buildingDetailId}`)
      // Get building details with location information in a single call
      const buildingDetailResponse = await firstValueFrom(
        this.buildingClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, {
          buildingDetailId: scheduleJob.buildingDetailId
        })
      )

      if (!buildingDetailResponse || !buildingDetailResponse.data) {
        console.error(`Building detail not found with ID: ${scheduleJob.buildingDetailId}`)
        return new ApiResponse(false, 'Không tìm thấy thông tin chi tiết tòa nhà', null)
      }

      const buildingDetail = buildingDetailResponse.data
      console.log(`Building details:`, {
        name: buildingDetail.name,
        description: buildingDetail.description,
        numberFloor: buildingDetail.numberFloor,
        area: buildingDetail.area,
        locationDetails: buildingDetail.locationDetails?.length || 0
      })

      console.log(`Fetching residents for building detail ID: ${scheduleJob.buildingDetailId}`)
      // Get residents for the building detail directly using the new endpoint
      const residentsResponse = await firstValueFrom(
        this.buildingClient.send(BUILDINGS_PATTERN.GET_RESIDENTS_BY_BUILDING_DETAIL_ID, scheduleJob.buildingDetailId)
      )

      // Check if we got any residents
      if (!residentsResponse.data || residentsResponse.data.length === 0) {
        console.log(`No residents found for building detail ID: ${scheduleJob.buildingDetailId}`)
        return new ApiResponse(
          true,
          'Không tìm thấy cư dân để gửi email',
          { message: 'Không gửi email nào' }
        )
      }

      console.log(`Found ${residentsResponse.data.length} residents to send emails to`)

      // Detailed logging to debug resident data structure
      console.log('Sample resident data:', residentsResponse.data.length > 0 ?
        JSON.stringify(residentsResponse.data[0], null, 2) : 'No residents found');

      // Create a map to track residents by email to ensure no duplicates
      const emailMap = new Map()

      // Process each resident
      residentsResponse.data.forEach(resident => {
        // Debug each resident
        console.log(`Processing resident: ${JSON.stringify({
          id: resident.userId,
          name: resident.name,
          username: resident.username,
          email: resident.email,
          firstName: resident.firstName,
          lastName: resident.lastName
        })}`);

        // Skip if already processed this email
        if (!resident.email || emailMap.has(resident.email)) {
          console.log(`Skipping resident ${resident.name || resident.username || resident.userId} - ${!resident.email ? 'no email address' : 'duplicate email'}`)
          return
        }

        // Add to map to prevent duplicates
        emailMap.set(resident.email, resident)
      })

      // Send email to each unique resident using notifications service
      const emailPromises = Array.from(emailMap.values()).map(resident => {
        // Get resident's name using username, name, or firstName+lastName
        const residentName = resident.username || resident.name ||
          (resident.firstName && resident.lastName ? `${resident.firstName} ${resident.lastName}` : null) ||
          'Cư dân';

        // Get location details for the resident
        const locationDetails = buildingDetail.locationDetails?.find(
          loc => loc.roomNumber === resident.apartmentNumber
        )

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

        console.log(`Sending email to resident: ${residentName} (${resident.email}) for maintenance from ${startTime} to ${endTime}`);

        return firstValueFrom(
          this.notificationsClient.emit(NOTIFICATIONS_PATTERN.SEND_EMAIL, {
            to: resident.email,
            residentName: residentName,
            buildingName: buildingDetail.name,
            maintenanceDate: scheduleJob.run_date,
            startTime: startTime,
            endTime: endTime,
            maintenanceType: scheduleJob.schedule.schedule_name,
            description: scheduleJob.schedule.description || 'Không có mô tả chi tiết',
            floor: locationDetails?.floorNumber?.toString() || buildingDetail.numberFloor?.toString() || 'Chưa xác định',
            area: buildingDetail.area?.name || 'Chưa xác định',
            unit: locationDetails?.roomNumber || resident.apartmentNumber || 'Chưa xác định'
          })
        )
      })

      await Promise.all(emailPromises)
      console.log('All maintenance schedule emails sent successfully')

      return new ApiResponse(
        true,
        'Gửi email lịch trình bảo trì thành công',
        { message: `Đã gửi email cho ${emailMap.size} cư dân` }
      )
    } catch (error) {
      console.error('Error sending maintenance emails:', error)
      return new ApiResponse(
        false,
        `Không thể gửi email lịch trình bảo trì: ${error.message}`,
        null
      )
    }
  }

  // async changeStatus(schedule_job_id: string, status: string) {
  //   console.log('🚀 ~ ScheduleJobsService ~ changeStatus ~ schedule_job_id:', schedule_job_id)
  //   try {
  //     console.log('🚀 ~ ScheduleJobsService ~ changeStatus ~ status:', status)

  //     // Check if the schedule job exists before trying to update
  //     const scheduleJob = await this.prismaService.scheduleJob.findUnique({
  //       where: { schedule_job_id },
  //     })

  //     // If schedule job does not exist, throw an exception
  //     if (!scheduleJob) {
  //       throw new RpcException({
  //         statusCode: 404,
  //         message: 'Schedule job not found',
  //       })
  //     }

  //     const scheduleJobStatus: ScheduleJobStatus = status as ScheduleJobStatus

  //     // Proceed to update the status
  //     const updatedScheduleJob = await this.prismaService.scheduleJob.update({
  //       where: { schedule_job_id },
  //       data: {
  //         status: scheduleJobStatus,
  //       },
  //     })

  //     return new ApiResponse<ScheduleJobResponseDto>(
  //       true,
  //       'Schedule job status updated successfully',
  //       updatedScheduleJob,
  //     )
  //   } catch (error) {
  //     console.error('Error updating schedule job status:', error)

  //     // Return a meaningful response for the error
  //     throw new RpcException({
  //       statusCode: 400,
  //       message: 'Error updating schedule job status',
  //       error: error.message,
  //     })
  //   }
  // }
}
