import { IsString, IsOptional } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  unit: string;
}
