// create-areas.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID } from 'class-validator';
// create-building-detail.dto.ts
import { $Enums } from '@prisma/client-building';

export class CreateLocationDetailDto {
  @IsNotEmpty()
  @IsUUID()
  buildingDetailId: string;

  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsInt()
  floorNumber: number;
  @IsNotEmpty()

  positionSide: $Enums.PositionSide;
  @IsNotEmpty()

  areaType: $Enums.AreaDetailsType;

  @IsOptional()
  @IsString()
  description?: string;
}