import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client-building'
import { LocationDetailDto } from '../LocationDetails/Locationdetails.dto';  // LocationDetail DTO if needed

export class CreateBuildingDetailDto {
  @ApiProperty({
    description: 'Unique identifier for the building',
    type: String,
    example: 'd1b0cd4c-1e76-4d7f-a0d4-81b32e5101cd'
  })
  @IsNotEmpty()
  @IsUUID()
  buildingId: string;

  @ApiProperty({
    description: 'Name of the building detail',
    type: String,
    example: 'West Wing'
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the building detail',
    type: String,
    example: 'Contains conference rooms and office spaces',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;



  @ApiProperty({
    description: 'Number of floors in this building section',
    type: Number,
    example: 5
  })
  @IsNotEmpty()
  @IsInt()
  floorNumber: number;

  @ApiProperty({
    description: 'Location details associated with this building detail',
    type: [LocationDetailDto],
    required: false
  })
  @IsOptional()
  locationDetails?: LocationDetailDto[];  // If you want to include LocationDetails in the same request
}
