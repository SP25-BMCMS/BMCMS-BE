// change-schedule-type.dto.ts
import { IsEnum } from 'class-validator'
import { $Enums } from '@prisma/client-schedule'
import { ApiProperty } from '@nestjs/swagger'

export class ChangeScheduleTypeDto {
  @ApiProperty({
    description: '',
    enum: $Enums.Frequency,
    enumName: 'WorkLogStatus',
    required: false,
    example: $Enums.Frequency.Daily + "Daily ,Weekly,Monthly,Yearly,Specific",
  })
  @IsEnum($Enums.Frequency)
  schedule_type: $Enums.Frequency
}