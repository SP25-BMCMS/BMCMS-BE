// create-areas.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, IsUUID } from 'class-validator';
// create-building-detail.dto.ts
import { $Enums } from '@prisma/client-building';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationDetailDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  buildingDetailId: string;

  @IsOptional()
  @IsString()
  @ApiProperty()

  roomNumber?: string;

  @IsInt()
  @ApiProperty()

  floorNumber: number;
  @IsNotEmpty()
  @ApiProperty()

  positionSide: $Enums.PositionSide;
  @IsNotEmpty()
  @ApiProperty()

  areaType: $Enums.AreaDetailsType;
  @ApiProperty()

  @IsOptional()
  @IsString()
  description?: string;
}