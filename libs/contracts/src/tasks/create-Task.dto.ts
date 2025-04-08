// create-areas.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsUUID } from 'class-validator';

import { $Enums } from '@prisma/client-Task'
import { ApiProperty } from '@nestjs/swagger';



export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'Description of the task', 
    type: String,
    required: true,
    example: 'Fix crack in building A'
  })
  description: string;

  @IsNotEmpty()
  @IsEnum($Enums.Status)
  @ApiProperty({ 
    description: 'The status of the task', 
    enum: $Enums.Status,
    required: true,
    example: 'Assigned|Completed'
  })
  status: $Enums.Status;

  @IsString()
  @IsOptional()
  @ApiProperty({ 
    description: 'The crack ID associated with the task', 
    type: String,
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  crack_id: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ 
    description: 'The schedule job ID associated with the task', 
    type: String,
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  schedule_job_id: string;
}