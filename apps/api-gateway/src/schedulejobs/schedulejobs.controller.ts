import { Body, Controller, Get, Param, Post, Put, Query, UseGuards, Patch, HttpException, HttpStatus, Req } from '@nestjs/common'
import { schedulejobsService } from './schedulejobs.service'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status'
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto'
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto'
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto'
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard'
import { SetMetadata } from '@nestjs/common'

export const SkipAuth = () => SetMetadata('skip-auth', true)

@Controller('schedule-jobs')
@ApiTags('schedules-jobs')
@UseGuards(PassportJwtAuthGuard)
@ApiBearerAuth('access-token')
export class ScheduleJobsController {
  constructor(private readonly scheduleJobsService: schedulejobsService) { }

  @Put('status/:schedule_job_id')
  @ApiOperation({ summary: 'Update schedule job status' })
  @ApiParam({ name: 'schedule_job_id', description: 'Schedule job ID' })
  @ApiBody({ type: UpdateScheduleJobStatusDto })
  @SwaggerResponse({ status: 200, description: 'Status updated successfully' })
  @SwaggerResponse({ status: 404, description: 'Schedule job not found' })
  async updateScheduleJobStatus(
    @Param('schedule_job_id') schedule_job_id: string,
    @Body() updateScheduleJobStatusDto: UpdateScheduleJobStatusDto,
  ): Promise<ApiResponse<any>> {
    return this.scheduleJobsService.updateScheduleJobStatus(
      schedule_job_id,
      updateScheduleJobStatusDto,
    )
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedule jobs with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  async getAllScheduleJobs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ApiResponse<any>> {
    return this.scheduleJobsService.getAllScheduleJobs({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    })
  }

  

  @Post()
  @ApiOperation({ summary: 'Create a new schedule job' })
  @ApiBody({ type: CreateScheduleJobDto })
  @SwaggerResponse({
    status: 201,
    description: 'Schedule job created successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  async createScheduleJob(
    @Body() createScheduleJobDto: CreateScheduleJobDto,
  ): Promise<ApiResponse<any>> {
    if (createScheduleJobDto.run_date) {
      createScheduleJobDto.run_date = new Date(createScheduleJobDto.run_date)
    }
    console.log(
      '🚀 ~ ScheduleJobsController ~ createScheduleJob ~ run_date:',
      createScheduleJobDto.run_date,
    )

    return this.scheduleJobsService.createScheduleJob(createScheduleJobDto)
  }

  @Put(':schedule_job_id')
  @ApiOperation({ summary: 'Update a schedule job' })
  @ApiParam({ name: 'schedule_job_id', description: 'Schedule job ID' })
  @ApiBody({ type: UpdateScheduleJobDto })
  @SwaggerResponse({
    status: 200,
    description: 'Schedule job updated successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Schedule job not found' })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  async updateScheduleJob(
    @Param('schedule_job_id') schedule_job_id: string,
    @Body() updateScheduleJobDto: UpdateScheduleJobDto,
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    const response = await this.scheduleJobsService.updateScheduleJob(
      schedule_job_id,
      updateScheduleJobDto,
    )
    return response
  }

  @Get('schedule/:scheduleId')
  @ApiOperation({ summary: 'Get schedule jobs by schedule ID' })
  @ApiParam({ name: 'scheduleId', description: 'Schedule ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @SwaggerResponse({
    status: 200,
    description: 'Returns a list of schedule jobs for the specified schedule ID',
  })
  async getScheduleJobsByScheduleId(
    @Param('scheduleId') scheduleId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const paginationParams: PaginationParams = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    }
    return this.scheduleJobsService.getScheduleJobsByScheduleId(scheduleId, paginationParams)
  }

  @Post(':id/send-maintenance-email')
  @ApiOperation({ summary: 'Send maintenance schedule email to residents' })
  @ApiParam({ name: 'id', description: 'Schedule job ID' })
  async sendMaintenanceEmail(@Param('id') scheduleJobId: string) {
    return this.scheduleJobsService.sendMaintenanceEmail(scheduleJobId)
  }
  @ApiBearerAuth('access-token')
  @UseGuards(PassportJwtAuthGuard)
  @Get('manager')
  @ApiOperation({ summary: 'Get all schedule jobs for buildings managed by the specified manager' })
  @SwaggerResponse({ status: 200, description: 'Returns all schedule jobs for buildings managed by the manager' })
  @SwaggerResponse({ status: 404, description: 'No schedule jobs found for buildings managed by this manager' })
  @SkipAuth()
  async getScheduleJobsByManagerId(@Req() req) {
    const managerId = req.user.userId;
    if (!managerId || managerId.trim() === '') {
      throw new HttpException('Manager ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.scheduleJobsService.getScheduleJobsByManagerId(managerId);
  }
  @Get(':schedule_job_id')
  @ApiOperation({ summary: 'Get schedule job by ID' })
  @ApiParam({ name: 'schedule_job_id', description: 'Schedule job ID' })
  @SwaggerResponse({ status: 200, description: 'Schedule job found' })
  @SwaggerResponse({ status: 404, description: 'Schedule job not found' })
  async getScheduleJobById(
    @Param('schedule_job_id') schedule_job_id: string,
  ): Promise<ApiResponse<any>> {
    return this.scheduleJobsService.getScheduleJobById(schedule_job_id)
  }

  // @Patch(':id/status')
  // @ApiOperation({ summary: 'Change schedule job status' })
 
  // async changeStatus(
  //   @Param('id') id: string,
  //   @Body() status: UpdateScheduleJobStatusDto,
  // ) {
  //   return this.scheduleJobsService.changeStatus(id, status.status)
  // }
}
// UpdateScheduleJobStatusDto