import { $Enums } from "@prisma/client"
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator"


export class CreateBuildingDto {
    @IsUUID()
    buildingId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  numberFloor: number;

  @IsOptional()
  @IsString()
  imageCover?: string;

  @IsOptional()
  @IsUUID()
  areaId?: string;
}
