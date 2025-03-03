// update-areas.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { $Enums } from '@prisma/client-Task'

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  status?: $Enums.Status;

  @IsOptional()
  @IsString()
  crack_id?: string;

  @IsOptional()
  @IsString()
  schedule_job_id?: string;
}