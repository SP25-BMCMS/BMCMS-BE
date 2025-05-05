import { Controller, Param } from '@nestjs/common'
import {
  Client,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices'
import { ScheduleService } from './Schedules.service'
import { CreateScheduleDto } from '@app/contracts/schedules/create-Schedules.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { UpdateScheduleDto } from '@app/contracts/schedules/update.Schedules'
import { ScheduleResponseDto } from '@app/contracts/schedules/Schedule.dto'
import { SCHEDULES_PATTERN } from '@app/contracts/schedules/Schedule.patterns'
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto'
import { AutoMaintenanceScheduleDto } from '@app/contracts/schedules/auto-maintenance-schedule.dto'
import { GenerateSchedulesConfigDto } from '@app/contracts/schedules/generate-schedules-config.dto'

@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) { }

  @MessagePattern(SCHEDULES_PATTERN.CREATE)
  async createSchedule(
    @Payload() createScheduleDto: CreateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.scheduleService.createSchedule(createScheduleDto)
  }

  @MessagePattern(SCHEDULES_PATTERN.UPDATE)
  async updateSchedule(
    @Payload()
    {
      schedule_id,
      updateScheduleDto,
    }: {
      schedule_id: string
      updateScheduleDto: UpdateScheduleDto
    },
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.scheduleService.updateSchedule(schedule_id, updateScheduleDto)
  }

  @MessagePattern(SCHEDULES_PATTERN.GET)
  async getAllSchedulesMicro(
    @Payload() paginationParams: PaginationParams = {},
  ): Promise<PaginationResponseDto<ScheduleResponseDto>> {
    return this.scheduleService.getAllSchedules(paginationParams)
  }

  @MessagePattern(SCHEDULES_PATTERN.GET_BY_ID)
  async getScheduleById(
    schedule_id: string,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    console.log(
      '🚀 ~ ScheduleController ~ getScheduleById ~ schedule_id:',
      typeof schedule_id,
    )
    return this.scheduleService.getScheduleById(schedule_id)
  }

  @MessagePattern(SCHEDULES_PATTERN.GET_BY_MANAGER_ID)
  async getSchedulesByManagerId(
    @Payload() { managerId, paginationParams }: { managerId: string; paginationParams?: PaginationParams },
  ): Promise<PaginationResponseDto<ScheduleResponseDto>> {
    return this.scheduleService.getSchedulesByManagerId(managerId, paginationParams)
  }

  @MessagePattern(SCHEDULES_PATTERN.DELELTE)
  async deleteSchedule(
    schedule_id: string,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.scheduleService.deleteSchedule(schedule_id)
  }

  @MessagePattern(SCHEDULES_PATTERN.CREATE_AUTO_MAINTENANCE)
  async createAutoMaintenanceSchedule(
    @Payload() dto: AutoMaintenanceScheduleDto
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.scheduleService.createAutoMaintenanceSchedule(dto);
  }

  @MessagePattern(SCHEDULES_PATTERN.TRIGGER_AUTO_MAINTENANCE)
  async triggerAutoMaintenanceSchedule(
    @Payload() { managerId }: { managerId: string }
  ): Promise<ApiResponse<string>> {
    return this.scheduleService.triggerAutoMaintenanceSchedule(managerId);
  }

  @MessagePattern(SCHEDULES_PATTERN.GENERATE_SCHEDULES)
  async generateSchedulesFromConfig(
    @Payload() configDto: GenerateSchedulesConfigDto
  ): Promise<ApiResponse<any>> {
    return this.scheduleService.generateSchedulesFromConfig(configDto);
  }
}
