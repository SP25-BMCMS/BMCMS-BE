import { IsOptional, IsString, IsEnum, IsDateString, IsInt } from 'class-validator';
import { $Enums } from '@prisma/client-Schedule';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'The name of the schedule', required: false })  // Optional property
  schedule_name?: string;

  @IsOptional()
  @IsEnum($Enums.ScheduleType)
  @ApiProperty({ description: 'The type of the schedule', required: false, enum: $Enums.ScheduleType ,
    example: $Enums.ScheduleType.Daily +"Daily ,Weekly,Monthly,Yearly,Specific",
    

    
  })  // Optional enum property
  schedule_type?: $Enums.ScheduleType;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'A brief description of the schedule', required: false })  // Optional description
  description?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'Start date of the schedule', required: false })  // Optional start date
  start_date?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'End date of the schedule', required: false })  // Optional end date
  end_date?: string;

}