import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto';
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto';
import { $Enums, PrismaClient } from '@prisma/client-Schedule';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status';
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new Schedule Job
  async createScheduleJob(createScheduleJobDto: CreateScheduleJobDto): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      const newScheduleJob = await this.prisma.scheduleJob.create({
        data: {
          schedule_id: createScheduleJobDto.schedule_id,
          run_date: createScheduleJobDto.run_date,
          status:  $Enums.ScheduleJobStatus.InProgress,
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
  async getAllScheduleJobs(): Promise<ApiResponse<ScheduleJobResponseDto[]>> {
    try {
      const scheduleJobs = await this.prisma.scheduleJob.findMany();
      return new ApiResponse<ScheduleJobResponseDto[]>(true, "All schedule jobs fetched successfully", scheduleJobs);
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: "Error retrieving all schedule jobs",
      });
    }
  }

  // Get Schedule Job by ID
  async getScheduleJobById(schedule_job_id: string): Promise<ApiResponse<ScheduleJobResponseDto>> {
    try {
      const scheduleJob = await this.prisma.scheduleJob.findUnique({
        where: { schedule_job_id },
      });
      if (!scheduleJob) {
        throw new RpcException({
          statusCode: 404,
          message: "Schedule job not found",
        });
      }
      return new ApiResponse<ScheduleJobResponseDto>(true, "Schedule job fetched successfully", scheduleJob);
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: "Error retrieving schedule job by ID",
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
        message: "Schedule job update failed",
      });
    }
  }
}