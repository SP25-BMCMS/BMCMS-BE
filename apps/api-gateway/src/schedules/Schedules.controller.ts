import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  Query,
  Patch,
  HttpException,
} from '@nestjs/common'
import { SchedulesService } from './Schedules.service'
import { catchError, firstValueFrom, NotFoundError } from 'rxjs'
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto'
import { ScheduleResponseDto } from '@app/contracts/schedules/Schedule.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules'
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
import { AutoMaintenanceScheduleDto } from '@app/contracts/schedules/auto-maintenance-schedule.dto'
import { GenerateSchedulesConfigDto } from '@app/contracts/schedules/generate-schedules-config.dto'
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard'

@Controller('schedules')
@ApiTags('schedules')
@ApiBearerAuth('access-token')
@UseGuards(PassportJwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) { }

  // Create schedule
  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(PassportJwtAuthGuard)
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiBody({ type: CreateScheduleDto })
  @SwaggerResponse({
    status: 201,
    description: 'Schedule created successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Bad request - Missing required fields or invalid data' })
  @SwaggerResponse({ status: 404, description: 'Maintenance cycle or building details not found' })
  @SwaggerResponse({ status: 408, description: 'Request timeout - Service may be unavailable' })
  @SwaggerResponse({ status: 500, description: 'Internal server error' })
  @HttpCode(HttpStatus.CREATED)
  async createSchedule(
    @Req() req,
    @Body() createScheduleDto: CreateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      // Get user ID from token/request
      const managerId = req.user.userId;
      console.log("managerId", managerId)
      
      if (!managerId) {
        throw new HttpException('User not authenticated or invalid token', HttpStatus.UNAUTHORIZED);
      }
      
      // Add managerId to the DTO
      createScheduleDto.managerid = managerId;
      
      return this.schedulesService.createSchedule(createScheduleDto);
    } catch (error) {
      console.error('Error in createSchedule controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create schedule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Update schedule
  @Put(':schedule_id')
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiParam({ name: 'schedule_id', description: 'Schedule ID' })
  @ApiBody({ type: UpdateScheduleDto })
  @SwaggerResponse({
    status: 200,
    description: 'Schedule updated successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @SwaggerResponse({ status: 404, description: 'Schedule, maintenance cycle, or building details not found' })
  @SwaggerResponse({ status: 408, description: 'Request timeout - Service may be unavailable' })
  @SwaggerResponse({ status: 500, description: 'Internal server error' })
  async updateSchedule(
    @Param('schedule_id') schedule_id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.schedulesService.updateSchedule(schedule_id, updateScheduleDto)
  }

  // Partial update schedule (PATCH)
  @Patch(':schedule_id')
  @ApiOperation({ summary: 'Partially update a schedule' })
  @ApiParam({ name: 'schedule_id', description: 'Schedule ID' })
  @ApiBody({ type: UpdateScheduleDto })
  @SwaggerResponse({
    status: 200,
    description: 'Schedule partially updated successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @SwaggerResponse({ status: 404, description: 'Schedule, maintenance cycle, or building details not found' })
  @SwaggerResponse({ status: 408, description: 'Request timeout - Service may be unavailable' })
  @SwaggerResponse({ status: 500, description: 'Internal server error' })
  async partialUpdateSchedule(
    @Param('schedule_id') schedule_id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.schedulesService.updateSchedule(schedule_id, updateScheduleDto)
  }

  @Post('auto-maintenance')
  @ApiOperation({ summary: 'Create an automated maintenance schedule based on maintenance cycles' })
  @ApiBody({ type: AutoMaintenanceScheduleDto })
  @SwaggerResponse({
    status: 201,
    description: 'Automated maintenance schedule created successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  @SwaggerResponse({ status: 404, description: 'Maintenance cycle not found' })
  async createAutoMaintenanceSchedule(
    @Req() req,
    @Body() autoMaintenanceDto: AutoMaintenanceScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    try {
      // Get user ID from token/request
      const managerId = req.user.userId;
      
      if (!managerId) {
        throw new HttpException('User not authenticated or invalid token', HttpStatus.UNAUTHORIZED);
      }
      
      // Add managerId to the DTO
      autoMaintenanceDto.managerId = managerId;
      
      return this.schedulesService.createAutoMaintenanceSchedule(autoMaintenanceDto);
    } catch (error) {
      console.error('Error in createAutoMaintenanceSchedule controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create auto maintenance schedule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('trigger-auto-maintenance')
  @ApiOperation({ summary: 'Trigger automatic creation of maintenance schedules from all maintenance cycles' })
  @SwaggerResponse({
    status: 201,
    description: 'Automated maintenance schedules creation triggered successfully',
  })
  @SwaggerResponse({ status: 404, description: 'No maintenance cycles or buildings found' })
  @SwaggerResponse({ status: 500, description: 'Server error' })
  @SwaggerResponse({ status: 408, description: 'Request timeout - operation may still be processing' })
  async triggerAutoMaintenanceSchedule(
    @Req() req
  ): Promise<ApiResponse<string>> {
    try {
      // Get user ID from token/request
      const managerId = req.user.userId;
      
      if (!managerId) {
        throw new HttpException('User not authenticated or invalid token', HttpStatus.UNAUTHORIZED);
      }
      
      // Call service with managerId
      return this.schedulesService.triggerAutoMaintenanceSchedule(managerId);
    } catch (error) {
      console.error('Error in triggerAutoMaintenanceSchedule controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to trigger auto maintenance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-schedules')
  @ApiOperation({ summary: 'Generate schedules from maintenance cycles with custom configurations' })
  @ApiBody({ type: GenerateSchedulesConfigDto })
  @SwaggerResponse({
    status: 201,
    description: 'Schedules generated successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Bad request - Missing required fields or invalid data' })
  @SwaggerResponse({ status: 404, description: 'Maintenance cycle or building details not found' })
  @SwaggerResponse({ status: 408, description: 'Request timeout - Service may be unavailable' })
  @SwaggerResponse({ status: 500, description: 'Internal server error' })
  @HttpCode(HttpStatus.CREATED)
  async generateSchedules(
    @Req() req,
    @Body() configDto: GenerateSchedulesConfigDto,
  ): Promise<any> {
    try {
      // Get user ID from token/request
      const managerId = req.user.userId;
      
      if (!managerId) {
        throw new HttpException('User not authenticated or invalid token', HttpStatus.UNAUTHORIZED);
      }
      
      // Add managerId to the DTO
      configDto.managerId = managerId;
      
      return this.schedulesService.generateSchedulesFromConfig(configDto);
    } catch (error) {
      console.error('Error in generateSchedules controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to generate schedules: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get all schedules
  @Get()
  @ApiOperation({ summary: 'Get all schedules' })
  @SwaggerResponse({ status: 200, description: 'Returns all schedules' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starting from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async getAllSchedules(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<any> {
    try {
      // Create pagination params object
      const paginationParams: PaginationParams = {
        page: page ? parseInt(page.toString()) : 1,
        limit: limit ? parseInt(limit.toString()) : 10,
      }

      return this.schedulesService.getAllSchedules(paginationParams)
    } catch (error) {
      console.error('Error in getAllSchedules controller:', error)
      throw new Error(`Failed to get schedules: ${error.message}`)
    }
  }

  @Delete(':schedule_id')
  @ApiOperation({ summary: 'Delete schedule (soft delete)' })
  @ApiParam({ name: 'schedule_id', description: 'Schedule ID' })
  @SwaggerResponse({ status: 200, description: 'Schedule and related jobs have been soft deleted' })
  @SwaggerResponse({ status: 404, description: 'Schedule not found' })
  async deleteSchedule(@Param('schedule_id') schedule_id: string) {
    return this.schedulesService.deleteSchedule(schedule_id)
  }

  @Get('manager')
  @ApiBearerAuth('access-token')
  @UseGuards(PassportJwtAuthGuard)
  @ApiOperation({ summary: 'Get schedules by manager ID from authenticated user token' })
  @SwaggerResponse({ status: 200, description: 'Returns schedules managed by the currently authenticated manager' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized - User not authenticated' })
  @SwaggerResponse({ status: 404, description: 'No schedules found for this manager' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starting from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @HttpCode(HttpStatus.CREATED)
  async getSchedulesByManagerId(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<any> {
   
    try {
      // Create pagination params object
      const paginationParams: PaginationParams = {
        page: page ? parseInt(page.toString()) : 1,
        limit: limit ? parseInt(limit.toString()) : 10,
      }
      const managerId = req.user.userId;
      if (!managerId) {
        console.log("Manager ID is missing, throwing 401");
        throw new HttpException('User not authenticated or invalid token', HttpStatus.UNAUTHORIZED);
      }
      console.log("Calling schedulesService.getSchedulesByManagerId with managerId:", managerId);
      return this.schedulesService.getSchedulesByManagerId(managerId, paginationParams)
    } catch (error) {
      console.error('Error in getSchedulesByManagerId controller:', error);
      console.error('Full error stack:', error.stack);
      throw new HttpException(
        `Failed to get schedules for manager: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      console.log("===== END getSchedulesByManagerId =====");
    }
  }

  // Get schedule by ID
  @Get(':schedule_id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiParam({ name: 'schedule_id', description: 'Schedule ID' })
  @SwaggerResponse({ status: 200, description: 'Schedule retrieved successfully' })
  @SwaggerResponse({ status: 404, description: 'Schedule not found' })
  async getScheduleById(@Param('schedule_id') schedule_id: string) {
    return this.schedulesService.getScheduleById(schedule_id)
  }
}
