import { IsOptional, IsString, IsEnum, IsDateString, IsInt } from 'class-validator';
import { $Enums } from '@prisma/client-Schedule';

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  schedule_name?: string;

  @IsOptional()
  schedule_type?: $Enums.ScheduleType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;


}