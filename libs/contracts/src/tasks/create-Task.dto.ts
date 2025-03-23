// create-areas.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsUUID } from 'class-validator';

import { $Enums } from '@prisma/client-Task'
import { ApiProperty } from '@nestjs/swagger';



export class CreateTaskDto {
  @IsString()
  @ApiProperty({ description: 'Description of the task', type: String })  // Adding description for description field
  description: string;

  @IsNotEmpty()
  @IsEnum($Enums.Status)
  @ApiProperty({ description: 'The status of the task', enum: $Enums.Status })  // Enum for status
  status: $Enums.Status;

  @IsString()
  @ApiProperty({ description: 'The crack ID associated with the task', type: String })  // Description for crack_id
  crack_id: string;

  @IsString()
  @ApiProperty({ description: 'The schedule job ID associated with the task', type: String })  // Description for schedule_job_id
  schedule_job_id: string;
}