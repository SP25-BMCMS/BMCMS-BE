// update-areas.dto.ts
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client-Task'
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Optional title for the task', required: false, type: String })  // Optional title field
  title?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Optional description for the task', required: false, type: String })  // Optional description field
  description?: string;

  @IsOptional()
  @IsEnum($Enums.Status)
  @ApiProperty({ description: 'Optional status of the task', required: false, enum: $Enums.Status })  // Optional status field with enum
  status?: $Enums.Status;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Optional crack ID associated with the task', required: false, type: String })  // Optional crack_id field
  crack_id?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Optional schedule job ID associated with the task', required: false, type: String })  // Optional schedule_job_id field
  schedule_job_id?: string;
}