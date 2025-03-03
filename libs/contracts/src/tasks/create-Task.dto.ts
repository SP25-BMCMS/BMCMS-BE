// create-areas.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsUUID } from 'class-validator';

import { $Enums } from '@prisma/client-Task'



export class CreateTaskDto {
  @IsString()
  description: string;

  @IsNotEmpty()
  status: $Enums.Status;

  @IsString()
  crack_id: string;

  @IsString()
  schedule_job_id: string;
}