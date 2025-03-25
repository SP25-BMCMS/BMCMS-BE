import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client-Schedule';
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { ScheduleResponseDto } from '@app/contracts/schedules/Schedule.dto';
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules';
import { $Enums } from '@prisma/client-Schedule';
import { PaginationParams, PaginationResponseDto } from '../../../libs/contracts/src/Pagination/pagination.dto';


@Injectable()
export class ScheduleService {
  private prisma = new PrismaClient();

  // Create Schedule
  async createSchedule(createScheduleDto: CreateScheduleDto): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      const newSchedule = await this.prisma.schedule.create({
        data: {
          schedule_name: createScheduleDto.schedule_name,
          schedule_type: createScheduleDto.schedule_type,
          description: createScheduleDto.description,
          start_date: createScheduleDto.start_date, // Convert Date to ISO string
          end_date: createScheduleDto.end_date, // Convert Date to ISO string
        },
      });
     

      return new ApiResponse<ScheduleResponseDto>(true, 'WorkLog created successfully', newSchedule);
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Schedule creation failed',
      });
    }
  }

  // Update Schedule
  async updateSchedule(schedule_id: string, updateScheduleDto: UpdateScheduleDto): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      const updatedSchedule = await this.prisma.schedule.update({
        where: { schedule_id },
        data: {
          schedule_name: updateScheduleDto.schedule_name,
          schedule_type: updateScheduleDto.schedule_type,
          description: updateScheduleDto.description,
          start_date: updateScheduleDto.start_date,
          end_date: updateScheduleDto.end_date,
        },
      });

      // Convert Prisma response to ScheduleResponseDto
      const scheduleResponse: ScheduleResponseDto = {
        ...updatedSchedule,
        start_date: updatedSchedule.start_date ? updatedSchedule.start_date : null,
        end_date: updatedSchedule.end_date ? updatedSchedule.end_date : null,
        created_at: updatedSchedule.created_at,
        updated_at: updatedSchedule.updated_at,
      };

      return new ApiResponse<ScheduleResponseDto>(true, 'Schedule updated successfully', scheduleResponse);
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Schedule update failed',
      });
    }
  }

  // Change Schedule Type
  async changeScheduleType(schedule_id: string, schedule_type: $Enums.ScheduleType): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      const updatedSchedule = await this.prisma.schedule.update({
        where: { schedule_id },
        data: {
          schedule_type,
        },
      });

      // Convert Prisma response to ScheduleResponseDto
      const scheduleResponse: ScheduleResponseDto = {
        ...updatedSchedule,
        start_date: updatedSchedule.start_date ? updatedSchedule.start_date : null,
        end_date: updatedSchedule.end_date ? updatedSchedule.end_date : null,
        created_at: updatedSchedule.created_at,
        updated_at: updatedSchedule.updated_at,
      };

      return new ApiResponse<ScheduleResponseDto>(true, 'Schedule type updated successfully', scheduleResponse);
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Change schedule type failed',
      });
    }
  }

  // Get all schedules
  async getAllSchedules(paginationParams?: PaginationParams): Promise<PaginationResponseDto<ScheduleResponseDto>> {
    try {
      // Default values if not provided
      const page = Math.max(1, paginationParams?.page || 1);
      const limit = Math.min(50, Math.max(1, paginationParams?.limit || 10));
      
      // Calculate skip value for pagination
      const skip = (page - 1) * limit;
      
      // Get paginated data
      const [schedules, total] = await Promise.all([
        this.prisma.schedule.findMany({
          skip,
          take: limit,
          orderBy: { created_at: 'desc' }
        }),
        this.prisma.schedule.count()
      ]);
      
      // Transform to response DTOs
      const scheduleResponse: ScheduleResponseDto[] = schedules.map(schedule => ({
        ...schedule,
        start_date: schedule.start_date ? schedule.start_date : null,
        end_date: schedule.end_date ? schedule.end_date : null,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at,
      }));
      
      // Use PaginationResponseDto for consistent response formatting
      return new PaginationResponseDto(
        scheduleResponse,
        total,
        page,
        limit,
        200,
        schedules.length > 0 ? 'Schedules retrieved successfully' : 'No schedules found'
      );
    } catch (error) {
      console.error('Error retrieving schedules:', error);
      throw new RpcException({
        statusCode: 500,
        message: `Error retrieving schedules: ${error.message}`
      });
    }
  }

  // Get schedule by ID
  async getScheduleById(schedule_id: string): Promise<ApiResponse<ScheduleResponseDto>> {

    try {
      
      const schedule = await this.prisma.schedule.findUnique({
        where: {     schedule_id,  // Truyền trực tiếp UUID
        },
      });
      if (!schedule) {
        throw new RpcException({
          statusCode: 404,
          message: 'Schedule not found',
        });
      }
      console.log("🚀 ~ ScheduleService ~ getScheduleById ~ schedule:", schedule)

      const scheduleResponse: ScheduleResponseDto = {
        ...schedule,
        start_date: schedule.start_date ? schedule.start_date : null,
        end_date: schedule.end_date ? schedule.end_date : null,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at,
      };

      return new ApiResponse<ScheduleResponseDto>(true, 'Schedule fetched successfully', scheduleResponse);
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving schedule' ,
      });
    }
  }
}