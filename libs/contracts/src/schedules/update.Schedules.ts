import { IsOptional, IsString, IsEnum, IsDateString, IsArray, IsUUID } from 'class-validator'
import { $Enums } from '@prisma/client-Schedule'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'The name of the schedule', required: false })  // Optional property
  schedule_name?: string

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'A brief description of the schedule', required: false })  // Optional description
  description?: string

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'Start date of the schedule', required: false })  // Optional start date
  start_date?: string

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'End date of the schedule', required: false })  // Optional end date
  end_date?: string

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiProperty({
    description: 'Array of building IDs associated with this schedule',
    required: false,
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000']
  })  // Optional building IDs
  buildingId?: string[]
}