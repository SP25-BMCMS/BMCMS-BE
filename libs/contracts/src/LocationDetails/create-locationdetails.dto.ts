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
  @ApiProperty({
    description: 'Type of area',
    enum: $Enums.PositionSide,
    example: 'Left | Right | Center'
  })
  positionSide: $Enums.PositionSide;
  @IsNotEmpty()
  @ApiProperty({
    description: 'Type of area',
    enum: $Enums.AreaType,
    example: $Enums.AreaDetailsType +"Floor ,Wall;Ceiling;column;Other;",
  })
  areaType: $Enums.AreaDetailsType;
  @ApiProperty()

  @IsOptional()
  @IsString()
  description?: string;
}