// create-location-detail.dto.ts
import { IsString, IsInt, IsUUID, IsOptional } from 'class-validator';

export class LocationDetailDto {
  @IsString()
  roomNumber: string;

  @IsInt()
  floorNumber: number;

  @IsString()
  positionSide: string;

  @IsString()
  areaType: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  buildingDetailId: string;
}
