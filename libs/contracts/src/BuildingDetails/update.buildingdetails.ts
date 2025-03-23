// update-building-detail.dto.ts
import { IsString, IsInt, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { $Enums } from '@prisma/client-building'

export class UpdateBuildingDetailDto {
   @IsNotEmpty()
    @IsString()
    name: string;
    @IsNotEmpty()
    @IsInt()
    numberFloor : number;
  @IsOptional()
  @IsUUID()
  buildingDetailId?: string;
  // @IsOptional()
  // locationDetails?: any[];
}
