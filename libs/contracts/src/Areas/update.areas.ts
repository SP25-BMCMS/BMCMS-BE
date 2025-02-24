// update-areas.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateAreaDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}