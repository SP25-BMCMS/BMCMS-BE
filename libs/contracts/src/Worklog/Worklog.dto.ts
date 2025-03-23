// libs/contracts/src/WorkLogs/worklog.response.dto.ts
import { $Enums } from '@prisma/client-Task';
import { IsString, IsUUID, IsDate, IsOptional } from 'class-validator';

export class WorkLogResponseDto {
  @IsUUID()
  worklog_id: string;

  @IsUUID()
  task_id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  status?: $Enums.WorkLogStatus;}
