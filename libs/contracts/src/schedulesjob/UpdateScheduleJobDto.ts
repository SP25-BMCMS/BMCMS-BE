import { IsUUID, IsOptional, IsString, IsDate } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client-schedule' // Assuming $Enums contains WorkLogStatus enum

export class UpdateScheduleJobDto {
  @ApiProperty({
    description: 'The ID of the schedule associated with the job (optional)',
    type: String,
    example: 'd1b0cd4c-1e76-4d7f-a0d4-81b32e5101cd',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  schedule_id?: string

  @ApiProperty({
    description: 'The scheduled run date of the job (optional)',
    type: String,
    example: '2025-03-15T10:00:00Z',
    required: false,
  })
  @IsOptional()
  run_date?: Date

  @ApiProperty({
    description: 'The status of the schedule job (optional)',
    type: String,
    enum: ['Pending', 'InProgress', 'Completed', 'Cancel'],
    example: 'InProgress',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: $Enums.ScheduleJobStatus

  @ApiProperty({
    description: 'The ID of the building associated with the job (optional)',
    type: String,
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsString()
  building_id?: string
}