// CreateScheduleDto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString, IsInt } from 'class-validator';
import { $Enums } from '@prisma/client-Schedule';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsString()
  schedule_name: string;

  @IsNotEmpty()
  schedule_type: $Enums.ScheduleType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  start_date?: Date;  // Changed to Date from string

  @IsOptional()
  end_date?: Date; 

}