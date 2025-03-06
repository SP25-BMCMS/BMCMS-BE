import { $Enums } from '@prisma/client-Task';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkLogDto {
  @IsNotEmpty()
  @IsUUID()
  task_id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;
  
    @IsOptional()
    status?: $Enums.WorkLogStatus;
}