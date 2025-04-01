import { IsString, IsUUID, IsNumber, IsDate, IsOptional, Min, Max } from 'class-validator';

export class FeedbackResponseDto {
  @IsUUID()
  feedback_id: string;

  @IsUUID()
  task_id: string;

  @IsString()
  feedback_by: string;

  @IsString()
  comments: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;
} 