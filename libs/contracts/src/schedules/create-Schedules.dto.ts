// CreateScheduleDto.ts
import { IsNotEmpty, IsString, IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator'
import { $Enums } from '@prisma/client-schedule'
import { ApiProperty } from '@nestjs/swagger'

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The name of the schedule',
    example: 'Monthly Elevator Maintenance'
  })
  schedule_name: string

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'A brief description of the schedule',
    required: false,
    example: 'Regular maintenance for all elevators'
  })
  description?: string

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Start date of the schedule',
    required: false,
    type: Date,
    example: '2023-12-01T00:00:00.000Z'
  })
  start_date?: string

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'End date of the schedule',
    required: false,
    type: Date,
    example: '2024-12-31T00:00:00.000Z'
  })
  end_date?: string

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    description: 'The ID of the maintenance cycle associated with this schedule',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
  })
  cycle_id: string

  @IsOptional()
  @IsEnum($Enums.ScheduleStatus)
  @ApiProperty({
    description: 'Status of the schedule',
    enum: $Enums.ScheduleStatus,
    default: $Enums.ScheduleStatus.InProgress,
    example: 'InProgress'
  })
  schedule_status?: $Enums.ScheduleStatus

  @IsOptional()
  @IsUUID('4', { each: true })
  @ApiProperty({
    description: 'Array of building detail IDs associated with this schedule',
    required: false,
    type: [String],
    example: ['d290f1ee-6c54-4b01-90e6-d701748f0851']
  })
  buildingDetailIds?: string[]
}