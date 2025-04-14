// CreateScheduleDto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString, IsInt } from 'class-validator'
import { $Enums } from '@prisma/client-schedule'
import { ApiProperty } from '@nestjs/swagger'

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The name of the schedule' })  // Adding description to the property for Swagger
  schedule_name: string


  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'A brief description of the schedule', required: false })  // Optional description
  description?: string

  @IsOptional()
  @ApiProperty({ description: 'Start date of the schedule', required: false, type: Date })  // Optional start date
  start_date?: Date

  @IsOptional()
  @ApiProperty({ description: 'End date of the schedule', required: false, type: Date })  // Optional end date
  end_date?: Date

  @IsOptional()
  @ApiProperty({ description: 'End date of the schedule', required: false, type: Array })  // Optional end date
  buildingId?: string[]
}