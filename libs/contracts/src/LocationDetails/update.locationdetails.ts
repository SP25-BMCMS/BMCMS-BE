// update-location-detail.dto.ts
import { IsString, IsInt, IsOptional, IsUUID } from 'class-validator';
import { $Enums } from '@prisma/client-building';



export class UpdateLocationDetailDto {
  @IsUUID()
  locationDetailId: string;

  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsOptional()
  @IsInt()
  floorNumber?: number;

  @IsOptional()
  @IsString()
  positionSide?: $Enums.PositionSide;

  @IsOptional()
  @IsString()
  areaType?: $Enums.AreaDetailsType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  buildingDetailId?: string;
}
