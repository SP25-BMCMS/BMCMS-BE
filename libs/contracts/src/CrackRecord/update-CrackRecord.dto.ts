import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CrackType } from '@prisma/client-Building';

export class UpdateCrackRecordDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ description: 'Location detail ID where the crack is found', required: false })
  locationDetailId?: string;

  @IsOptional()
  @IsEnum(CrackType)
  @ApiProperty({ description: 'Type of crack', enum: CrackType, required: false })
  crackType?: CrackType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Length of the crack in meters/centimeters', required: false })
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Width of the crack in meters/centimeters', required: false })
  width?: number;

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