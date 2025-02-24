// create-areas.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}