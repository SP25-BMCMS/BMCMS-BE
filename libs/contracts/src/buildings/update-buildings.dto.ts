import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsUUID } from 'class-validator';

export class UpdateBuildingDto {
  // @IsUUID()
  // buildingId: string;

  // @IsOptional()
  // @IsString()
  // name?: string;

  // @IsOptional()
  // @IsString()
  // description?: string;

  // @IsOptional()
  // @IsInt()
  // numberFloor?: number;

  // @IsOptional()
  // @IsString()
  // imageCover?: string;

  // @IsOptional()
  // @IsUUID()
  // areaId?: string;
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
}
