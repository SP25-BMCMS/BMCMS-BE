import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CrackType } from '@prisma/client-building';

export class CreateCrackRecordDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ description: 'Location detail ID where the crack is found' })
  locationDetailId: string;

  @IsNotEmpty()
  @IsEnum(CrackType)
  @ApiProperty({ description: 'Type of crack', enum: CrackType })
  crackType: CrackType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Length of the crack in meters/centimeters' })
  length: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Width of the crack in meters/centimeters' })
  width: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Depth of the crack in meters/centimeters', required: false })
  depth?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Additional description of the crack', required: false })
  description?: string;
} 