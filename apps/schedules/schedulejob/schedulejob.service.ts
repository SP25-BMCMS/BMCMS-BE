import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto';
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto';
import { $Enums, PrismaClient } from '@prisma/client-Schedule';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status';
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto';
import { PaginationParams, PaginationResponseDto } from '../../../libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class ScheduleJobsService {
  private prisma = new PrismaClient();

  // Create a new Schedule Job
  async createScheduleJob(createScheduleJobDto: CreateScheduleJobDto): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      const newScheduleJob = await this.prisma.scheduleJob.create({
        data: {
          schedule_id: createScheduleJobDto.schedule_id,
          run_date: createScheduleJobDto.run_date,
          // status:  $Enums.ScheduleJobStatus.InProgress,
          status:  createScheduleJobDto.status,
          building_id: createScheduleJobDto.building_id,
        },
      });
      return new ApiResponse<ScheduleJobResponseDto>(true, "Schedule job created successfully", newScheduleJob);
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: error.message,
      });
    }
  }

  // Get all Schedule Jobs
  async getAllScheduleJobs(paginationParams?: PaginationParams): Promise<PaginationResponseDto<ScheduleJobResponseDto>> {
    try {
      // Default values if not provided
      const page = Math.max(1, paginationParams?.page || 1);
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10));
      
      // Calculate skip value for pagination
      const skip = (page - 1) * limit;
      
      // Get total count for pagination metadata
      const total = await this.prisma.scheduleJob.count();
      
      // If no schedule jobs found at all
      if (total === 0) {
        return new PaginationResponseDto(
          [],
          0,
          page,
          limit,
          404,
          "No schedule jobs found"
        );
      }
      
      // Get paginated data
      const scheduleJobs = await this.prisma.scheduleJob.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      });
      
      // Use PaginationResponseDto for consistent response formatting
      return new PaginationResponseDto(
        scheduleJobs,
        total,
        page,
        limit,
        200,
        scheduleJobs.length > 0 ? "Schedule jobs fetched successfully" : "No schedule jobs found for this page"
      );
    } catch (error) {
      console.error('Error retrieving schedule jobs:', error);
      throw new RpcException({
        statusCode: 500,
        message: `Error retrieving schedule jobs: ${error.message}`
      });
    }
  }

  // Get Schedule Job by ID
  async getScheduleJobById(schedule_job_id: string): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      console.log("🚀 ~ InspectionsService ~ getScheduleJobById ~ scheduleJob:", schedule_job_id)

      const scheduleJob = await this.prisma.scheduleJob.findUnique({
        where: { schedule_job_id },
      });
      if (!scheduleJob) {

        throw new RpcException({
          statusCode: 404,
          mescsage: "Shedule job not found",
        });
        console.log("🚀 ~ InspectionsService!!!!!!!!!1 ~ getScheduleJobById ~ scheduleJob:", scheduleJob)

      }
      console.log("🚀 ~ InspectionsServiceduoi ~ getScheduleJobById ~ scheduleJob:", scheduleJob)

      return new ApiResponse<ScheduleJobResponseDto>(true, "Schedule job fetched successfully", scheduleJob);
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: "Error retrieving schedule job by IDD",
      });
    }
  }

  // Update Schedule Job Status
  async updateScheduleJobStatus(
    updateScheduleJobStatusDto: UpdateScheduleJobStatusDto
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      const { schedule_job_id, status } = updateScheduleJobStatusDto;

      const updatedScheduleJob = await this.prisma.scheduleJob.update({
        where: { schedule_job_id },
        data: {
          status,
        },
      });
      return new ApiResponse<ScheduleJobResponseDto>(true, "Schedule job status updated successfully", updatedScheduleJob);
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: "Schedule job status update failed",
      });
    }
  }
  async updateScheduleJob(
    schedule_job_id: string,
    updateData: Partial<UpdateScheduleJobDto>  // Partial allows updating only the fields provided
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      // Try to update the schedule job with the given data
      const updatedScheduleJob = await this.prisma.scheduleJob.update({
        where: { schedule_job_id },
        data: {
          schedule_id: updateData.schedule_id,  // Nếu có, cập nhật schedule_id
          run_date: updateData.run_date,  // Nếu có, cập nhật run_date
          status: updateData.status,  // Nếu có, cập nhật status
          building_id: updateData.building_id,  // Nếu có, cập nhật building_id        },
      }});

      return new ApiResponse<ScheduleJobResponseDto>(true, "Schedule job updated successfully", updatedScheduleJob);
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: "Schedule job update failed" + error.message,
      });
    }
  }
}