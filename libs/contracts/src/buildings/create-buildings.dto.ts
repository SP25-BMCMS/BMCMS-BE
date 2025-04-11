import { ApiProperty } from "@nestjs/swagger";
import { $Enums } from "@prisma/client-building"
import { IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator"
import { Type } from "class-transformer";

export class CreateBuildingDto {

  @ApiProperty({
    description: 'Name of the building',
    type: String,
    example: 'S7',
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



  @ApiProperty({
    description: 'Construction date of the building',
    type: Date,
    example: '2022-01-01',
  })
  @Type(() => Date)
  @IsDate()
  construction_date: Date;

  @ApiProperty({
    description: 'Completion date of the building',
    type: Date,
    example: '2023-12-31',
  })
  @Type(() => Date)
  @IsDate()
  completion_date: Date;

  @ApiProperty({
    description: 'Warranty date of the building',
    type: Date,
    example: '2026-12-31',
  })
  @Type(() => Date)
  @IsDate()
  Warranty_date: Date;


  @ApiProperty({
    description: 'The status of the building',
    enum: $Enums.BuildingStatus,
    example: `${$Enums.BuildingStatus.operational}|${$Enums.BuildingStatus.under_construction}|${$Enums.BuildingStatus.completion_date}`
  })
  @IsNotEmpty()
  @IsEnum($Enums.BuildingStatus)
  status: $Enums.BuildingStatus;
}
