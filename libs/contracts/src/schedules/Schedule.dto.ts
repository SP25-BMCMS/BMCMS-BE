// schedule-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client-Schedule'
import { IsDateString, IsOptional } from 'class-validator'

export class ScheduleResponseDto {
  schedule_id: string

  schedule_name: string

<<<<<<< HEAD
=======
  schedule_type: $Enums.Frequency
>>>>>>> 4e2e49669949f2e43f6f2f3f47f1071f9e0b0d0e

  description?: string
  @IsOptional()
  start_date?: Date  // Changed to Date

  @IsOptional()
  end_date?: Date    // Changed to Date

  created_at: Date    // Changed to Date

<<<<<<< HEAD
  updated_at: Date;
=======
  updated_at: Date
>>>>>>> 4e2e49669949f2e43f6f2f3f47f1071f9e0b0d0e
}
