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
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) { }

  // @MessagePattern(SCHEDULES_PATTERN.CREATE)
  // async createSchedule(
  //   @Payload() createScheduleDto: CreateScheduleDto,
  // ): Promise<ApiResponse<ScheduleResponseDto>> {
  //   return this.scheduleService.createSchedule(createScheduleDto)
  // }

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

<<<<<<< HEAD
=======
  @MessagePattern(SCHEDULES_PATTERN.UPDATE_TYPE)
  async changeScheduleType(
    @Payload()
    {
      schedule_id,
      schedule_type,
    }: {
      schedule_id: string
      schedule_type: $Enums.Frequency
    },
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.scheduleService.changeScheduleType(schedule_id, schedule_type)
  }
>>>>>>> 4e2e49669949f2e43f6f2f3f47f1071f9e0b0d0e

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

  @MessagePattern(SCHEDULES_PATTERN.DELELTE)
  async deleteSchedule(
    schedule_id: string,
  ): Promise<ApiResponse<ScheduleResponseDto>> {
    return this.scheduleService.deleteSchedule(schedule_id)
  }
}
