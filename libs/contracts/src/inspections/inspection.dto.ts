import { IsUUID, IsString, IsOptional, IsEnum, IsDate } from 'class-validator';

export class InspectionDto {
  @IsUUID()
  task_assignment_id: string;

  @IsUUID()
  crack_id: string;

  @IsUUID()
  inspected_by: string;

  @IsDate()
  inspection_date: Date;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsString()
  description: string;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;
}
