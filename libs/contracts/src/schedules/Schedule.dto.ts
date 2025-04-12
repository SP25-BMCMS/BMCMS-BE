// schedule-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client-Schedule'
import { IsDateString, IsOptional } from 'class-validator'

export class ScheduleResponseDto {
  schedule_id: string

  schedule_name: string

  schedule_type: $Enums.Frequency

  description?: string
  @IsOptional()
  start_date?: Date  // Changed to Date

  @IsOptional()
  end_date?: Date    // Changed to Date

  created_at: Date    // Changed to Date

  updated_at: Date
}
