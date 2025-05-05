import { IsOptional, IsString, IsEnum, IsDateString, IsUUID } from 'class-validator'
import { $Enums } from '@prisma/client-schedule'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The name of the schedule',
    required: false,
    example: 'Updated Elevator Maintenance'
  })
  schedule_name?: string

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'A brief description of the schedule',
    required: false,
    example: 'Updated maintenance schedule for elevators'
  })
  description?: string

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Start date of the schedule',
    required: false,
    example: '2023-12-01T00:00:00.000Z'
  })
  start_date?: string

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'End date of the schedule',
    required: false,
    example: '2024-12-31T00:00:00.000Z'
  })
  end_date?: string

  @IsOptional()
  @IsEnum($Enums.ScheduleStatus)
  @ApiProperty({
    description: 'Status of the schedule',
    enum: $Enums.ScheduleStatus,
    required: false,
    example: 'InProgress'
  })
  schedule_status?: $Enums.ScheduleStatus

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'ID of the maintenance cycle',
    required: false,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
  })
  cycle_id?: string

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'ID of the manager responsible for this schedule',
    required: false,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
  })
  managerid?: string

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