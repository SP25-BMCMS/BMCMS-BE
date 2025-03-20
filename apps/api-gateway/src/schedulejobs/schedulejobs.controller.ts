import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { schedulejobsService } from './schedulejobs.service';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { UpdateScheduleJobStatusDto } from '@app/contracts/schedulesjob/update.schedule-job-status';
import { CreateScheduleJobDto } from '@app/contracts/schedulesjob/create-schedule-job.dto';
import { UpdateScheduleJobDto } from '@app/contracts/schedulesjob/UpdateScheduleJobDto';
import { ScheduleJobResponseDto } from '@app/contracts/schedulesjob/schedule-job.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

@Controller('schedule-jobs')
@ApiTags('schedules')
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
    return this.scheduleJobsService.updateScheduleJobStatus(schedule_job_id, updateScheduleJobStatusDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedule jobs' })
  @SwaggerResponse({ status: 200, description: 'Returns all schedule jobs' })
  async getAllScheduleJobs(): Promise<ApiResponse<any>> {
    return this.scheduleJobsService.getAllScheduleJobs();
  }

  @Get(':schedule_job_id')
  @ApiOperation({ summary: 'Get schedule job by ID' })
  @ApiParam({ name: 'schedule_job_id', description: 'Schedule job ID' })
  @SwaggerResponse({ status: 200, description: 'Schedule job found' })
  @SwaggerResponse({ status: 404, description: 'Schedule job not found' })
  async getScheduleJobById(@Param('schedule_job_id') schedule_job_id: string): Promise<ApiResponse<any>> {
    return this.scheduleJobsService.getScheduleJobById(schedule_job_id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new schedule job' })
  @ApiBody({ type: CreateScheduleJobDto })
  @SwaggerResponse({ status: 201, description: 'Schedule job created successfully' })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  async createScheduleJob(@Body() createScheduleJobDto: CreateScheduleJobDto): Promise<ApiResponse<any>> {
    if (createScheduleJobDto.run_date) {
      createScheduleJobDto.run_date = new Date(createScheduleJobDto.run_date);
    }
    console.log("🚀 ~ ScheduleJobsController ~ createScheduleJob ~ run_date:", createScheduleJobDto.run_date)

    return this.scheduleJobsService.createScheduleJob(createScheduleJobDto);
  }

  @Put(':schedule_job_id')
  @ApiOperation({ summary: 'Update a schedule job' })
  @ApiParam({ name: 'schedule_job_id', description: 'Schedule job ID' })
  @ApiBody({ type: UpdateScheduleJobDto })
  @SwaggerResponse({ status: 200, description: 'Schedule job updated successfully' })
  @SwaggerResponse({ status: 404, description: 'Schedule job not found' })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  async updateScheduleJob(
    @Param('schedule_job_id') schedule_job_id: string,
    @Body() updateScheduleJobDto: UpdateScheduleJobDto
  ): Promise<ApiResponse<ScheduleJobResponseDto>> {
    const response = await this.scheduleJobsService.updateScheduleJob(schedule_job_id, updateScheduleJobDto);
    return response;
  }
}