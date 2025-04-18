import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client-building';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class UpdateDeviceDto {
  @ApiProperty({ description: 'Device name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Device type', enum: DeviceType, required: false })
  @IsEnum(DeviceType)
  @IsOptional()
  type?: DeviceType;

  @ApiProperty({ description: 'Device manufacturer', required: false })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({ description: 'Device model', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ description: 'Building detail ID', required: false })
  @IsString()
  @IsOptional()
  buildingDetailId?: string;

  @ApiProperty({ description: 'Contract ID', required: false })
  @IsString()
  @IsOptional()
  contract_id?: string;
} 