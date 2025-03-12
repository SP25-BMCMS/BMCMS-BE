// CreateScheduleDto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString, IsInt } from 'class-validator';
import { $Enums } from '@prisma/client-Schedule';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The name of the schedule' })  // Adding description to the property for Swagger
  schedule_name: string;

  @IsNotEmpty()
  @IsEnum($Enums.ScheduleType)
  @ApiProperty({ description: 'The type of the schedule', enum: $Enums.ScheduleType
,      example: $Enums.ScheduleType.Daily +"Daily ,Weekly,Monthly,Yearly,Specific",

   })  // Enum description for Swagger
  schedule_type: $Enums.ScheduleType;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'A brief description of the schedule', required: false })  // Optional description
  description?: string;

  @IsOptional()
  @ApiProperty({ description: 'Start date of the schedule', required: false, type: Date })  // Optional start date
  start_date?: Date;

  @IsOptional()
  @ApiProperty({ description: 'End date of the schedule', required: false, type: Date })  // Optional end date
  end_date?: Date;
}