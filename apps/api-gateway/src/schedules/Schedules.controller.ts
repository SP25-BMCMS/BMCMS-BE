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
} from '@nestjs/common';
import { SchedulesService } from './Schedules.service';
import { catchError, firstValueFrom, NotFoundError } from 'rxjs';
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto';
import { ScheduleResponseDto } from '@app/contracts/schedules/Schedule.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules';
import { $Enums } from '@prisma/client-Schedule';
import { ChangeScheduleTypeDto } from '@app/contracts/schedules/changeScheduleStatusDto ';
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}
 // Create schedule (API Gateway)
 @Post()
 async createSchedule(@Body() createScheduleDto: CreateScheduleDto): Promise<ApiResponse<ScheduleResponseDto>> {
   return this.schedulesService.createSchedule(createScheduleDto);
 }

 // Update schedule (API Gateway)
 @Put(':schedule_id')
 async updateSchedule(
   @Param('schedule_id') schedule_id: string,
   @Body() updateScheduleDto: UpdateScheduleDto,
 ): Promise<ApiResponse<ScheduleResponseDto>> {
   return this.schedulesService.updateSchedule(schedule_id, updateScheduleDto);
 }

 // Change schedule type (API Gateway)
 @Put('change-type/:schedule_id')
 async changeScheduleType(
   @Param('schedule_id') schedule_id: string,
   @Body() changeScheduleTypeDto: ChangeScheduleTypeDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
   return this.schedulesService.changeScheduleType(schedule_id, changeScheduleTypeDto.schedule_type);
 }

 // Get all schedules (API Gateway)
 @Get()
 async getAllSchedules(): Promise<ApiResponse<ScheduleResponseDto[]>> {
   return this.schedulesService.getAllSchedules();
 }

 // Get schedule by ID (API Gateway)
 @Get(':schedule_id')
 async getScheduleById(@Param('schedule_id') schedule_id: string): Promise<ApiResponse<ScheduleResponseDto>> {
   return this.schedulesService.getScheduleById(schedule_id);
 }
}
