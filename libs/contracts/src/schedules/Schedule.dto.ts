// schedule-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client-schedule'
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'

export class ScheduleResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the schedule',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
  })
  schedule_id: string

  @ApiProperty({
    description: 'Name of the schedule',
    example: 'Monthly Elevator Maintenance'
  })
  schedule_name: string

  @ApiProperty({
    description: 'Description of the schedule',
    required: false,
    example: 'Regular maintenance for all elevators'
  })
  description?: string

  @IsOptional()
  @ApiProperty({
    description: 'Start date of the schedule',
    required: false,
    example: '2023-12-01T00:00:00.000Z'
  })
  start_date?: Date

  @IsOptional()
  @ApiProperty({
    description: 'End date of the schedule',
    required: false,
    example: '2024-12-31T00:00:00.000Z'
  })
  end_date?: Date

  @ApiProperty({
    description: 'Date when the schedule was created',
    example: '2023-11-30T09:00:00.000Z'
  })
  created_at: Date

  @ApiProperty({
    description: 'Date when the schedule was last updated',
    example: '2023-11-30T09:30:00.000Z'
  })
  updated_at: Date

  @ApiProperty({
    description: 'Current status of the schedule',
    enum: $Enums.ScheduleStatus,
    example: 'InProgress'
  })
  schedule_status: $Enums.ScheduleStatus

  @ApiProperty({
    description: 'ID of the maintenance cycle',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
  })
  cycle_id: string

  @ApiProperty({
    description: 'Schedule jobs associated with this schedule',
    type: 'array',
    required: false
  })
  schedule_job?: any[]
}
