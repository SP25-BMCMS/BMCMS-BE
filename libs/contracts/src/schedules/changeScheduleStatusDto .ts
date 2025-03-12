// change-schedule-type.dto.ts
import { IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client-Schedule';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeScheduleTypeDto {
   @ApiProperty({
      description: '',
      enum: $Enums.ScheduleType,
      enumName: 'WorkLogStatus',
      required: false,
      example: $Enums.ScheduleType.Daily +"Daily ,Weekly,Monthly,Yearly,Specific",
    })
  @IsEnum($Enums.ScheduleType)
  schedule_type: $Enums.ScheduleType;
}