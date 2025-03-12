// change-schedule-type.dto.ts
import { IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client-Schedule';

export class ChangeScheduleTypeDto {
  @IsEnum($Enums.ScheduleType)
  schedule_type: $Enums.ScheduleType;
}