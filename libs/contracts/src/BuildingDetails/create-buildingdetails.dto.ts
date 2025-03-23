import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { $Enums } from '@prisma/client-building'
import { LocationDetailDto } from '../LocationDetails/Locationdetails.dto';  // LocationDetail DTO if needed

export class CreateBuildingDetailDto {
  @IsNotEmpty()
  @IsUUID()
  buildingId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  areaType: $Enums.AreaType; // Enum value (AreaType)

  @IsNotEmpty()
  @IsInt()
  floorNumber: number;
  @IsOptional()
  locationDetails?: LocationDetailDto[];  // If you want to include LocationDetails in the same request
}
