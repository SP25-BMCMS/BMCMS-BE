import { ApiProperty } from "@nestjs/swagger";
import { $Enums } from "@prisma/client-building"
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator"


export class CreateBuildingDto {
  //   @IsUUID()
  //   buildingId: string;

  // @IsString()
  // @IsNotEmpty()
  // name: string;

  // @IsOptional()
  // @IsString()
  // description?: string;

  // @IsInt()
  // numberFloor: number;

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
    description: 'Name of the building',
    type: String,
    example: 'Skyline Tower',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

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
    description: 'Number of floors in the building',
    type: Number,
    example: 25,
  })
  @IsInt()
  numberFloor: number;

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
  @IsOptional()
  @IsUUID()
  areaId?: string;



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
    @ApiProperty({ description: 'The status of the building', enum: $Enums.BuildingStatus, example :"" +$Enums.BuildingStatus.operational+"|" + $Enums.BuildingStatus.under_construction })  // Enum for status
    status: $Enums.BuildingStatus;
}
