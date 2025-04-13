import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client-building';
import { IsString, IsInt, IsOptional, IsUUID, IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateBuildingDto {

  @ApiProperty({
    description: 'Unique identifier for the building',
    type: String,
    example: 'd1b0cd4c-1e76-4d7f-a0d4-81b32e5101cd', // Example UUID
  })
  @IsUUID()
  buildingId: string;

  @ApiProperty({
    description: 'Name of the building (optional)',
    type: String,
    example: 'Skyline Tower',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Description of the building (optional)',
    type: String,
    example: 'A modern skyscraper with 25 floors.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Number of floors in the building (optional)',
    type: Number,
    example: 25,
    required: false,
  })
  @IsOptional()
  @IsInt()
  numberFloor?: number;

  @ApiProperty({
    description: 'Cover image URL of the building (optional)',
    type: String,
    example: 'https://example.com/building-image.jpg',
    required: false,
  })
  @ApiProperty()
  @IsOptional()
  @IsString()
  imageCover?: string;

  @ApiProperty({
    description: 'Area ID associated with the building (optional)',
    type: String,
    example: 'd1b0cd4c-1e76-4d7f-a0d4-81b32e5101cd',
    required: false,
  })
  @ApiProperty()

  @IsOptional()
  @IsUUID()
  areaId?: string;

  @ApiProperty({
    description: 'Manager ID associated with the building (optional)',
    type: String,
    example: '8e8c4a45-9c2d-4d2f-a5b6-7e3a9f0d8c1e',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  construction_date?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  completion_date?: string;


  @IsNotEmpty()
  @IsEnum($Enums.BuildingStatus)
  @ApiProperty({ description: 'The status of the building', enum: $Enums.BuildingStatus, example: "" + $Enums.BuildingStatus.operational + "|" + $Enums.BuildingStatus.under_construction })  // Enum for status
  status: $Enums.BuildingStatus;
}
