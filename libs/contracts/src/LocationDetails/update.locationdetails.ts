// update-location-detail.dto.ts
import { IsString, IsInt, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client-building';
import { ApiProperty } from '@nestjs/swagger';



export class UpdateLocationDetailDto {
  // @IsUUID()
  
  // locationDetailId: string;

  // @IsOptional()
  // @IsString()
  // roomNumber?: string;

  // @IsOptional()
  // @IsInt()
  // floorNumber?: number;

  // @IsOptional()
  // @IsString()
  // positionSide?: $Enums.PositionSide;

  // @IsOptional()
  // @IsString()
  // areaType?: $Enums.AreaDetailsType;

  // @IsOptional()
  // @IsString()
  // description?: string;

  // @IsOptional()
  // @IsUUID()
  // buildingDetailId?: string;
  @IsUUID()
  @ApiProperty({ description: 'The unique identifier for the location detail', type: String })
  locationDetailId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Room number of the location detail', required: false, type: String })
  roomNumber?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ description: 'Floor number of the location detail', required: false, type: Number })
  floorNumber?: number;

  @IsOptional()
  @IsString()
  @IsEnum($Enums.PositionSide)
  @ApiProperty({
    description: 'Position side of the location detail',
    required: false,
    enum: $Enums.PositionSide,  // Enum for position side
    example: $Enums.PositionSide +"Left ,Right;Center",

  })
  positionSide?: $Enums.PositionSide;

  @IsOptional()
  @IsString()
  @IsEnum($Enums.AreaDetailsType)
  @ApiProperty({
    description: 'Area type of the location detail',
    required: false,
    enum: $Enums.AreaDetailsType ,
          example: $Enums.AreaDetailsType +"Floor ,Wall;Ceiling;column;Other;",
    
  })
  areaType?: $Enums.AreaDetailsType;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Description of the location detail', required: false, type: String })
  description?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ description: 'The unique identifier for the building detail', required: false, type: String })
  buildingDetailId?: string;
}
