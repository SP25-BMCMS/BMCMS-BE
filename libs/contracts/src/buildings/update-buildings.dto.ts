import { IsString, IsInt, IsOptional, IsUUID } from 'class-validator';

export class UpdateBuildingDto {
  @IsUUID()
  buildingId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  numberFloor?: number;

  @IsOptional()
  @IsString()
  imageCover?: string;

  @IsOptional()
  @IsUUID()
  areaId?: string;
}
