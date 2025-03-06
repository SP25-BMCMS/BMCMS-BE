import { $Enums } from '@prisma/client-Task';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateWorkLogDto {
  @IsUUID()
  worklog_id: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
    @IsOptional()
    status?: $Enums.WorkLogStatus;
}