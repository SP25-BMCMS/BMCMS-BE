import { Controller, Param } from '@nestjs/common';
import { Client, MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {  ScheduleService } from './Schedules.service';
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules';
import { ScheduleResponseDto } from '@app/contracts/schedules/Schedule.dto';
import { $Enums } from '@prisma/client-Schedule';
import { SCHEDULES_PATTERN } from '@app/contracts/schedules/Schedule.patterns';
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  
  @MessagePattern(SCHEDULES_PATTERN.CREATE)
  async createSchedule(@Payload() createScheduleDto: CreateScheduleDto): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.scheduleService.createSchedule(createScheduleDto);
  }

  @MessagePattern(SCHEDULES_PATTERN.UPDATE)
  async updateSchedule(@Payload() { schedule_id, updateScheduleDto }: { schedule_id: string; updateScheduleDto: UpdateScheduleDto }): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.scheduleService.updateSchedule(schedule_id, updateScheduleDto);
  }

  @MessagePattern(SCHEDULES_PATTERN.UPDATE_TYPE)
  async changeScheduleType(@Payload() { schedule_id, schedule_type }: { schedule_id: string; schedule_type: $Enums.ScheduleType }): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.scheduleService.changeScheduleType(schedule_id, schedule_type);
  }

  @MessagePattern(SCHEDULES_PATTERN.GET)
  async getAllSchedulesMicro(): Promise<ApiResponse<ScheduleResponseDto[]>> {
    return this.scheduleService.getAllSchedules();
  }

  @MessagePattern(SCHEDULES_PATTERN.GET_BY_ID)
  async getScheduleById(schedule_id: string): Promise<ApiResponse<ScheduleResponseDto>> {
    console.log("🚀 ~ ScheduleController ~ getScheduleById ~ schedule_id:", typeof schedule_id)
    return this.scheduleService.getScheduleById(schedule_id);
  }
}