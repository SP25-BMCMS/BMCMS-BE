import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DeviceType } from '@prisma/client-building';

export class CreateDeviceDto {
  @ApiProperty({ description: 'Device name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Device type', enum: DeviceType })
  @IsEnum(DeviceType)
  type: DeviceType;

  @ApiProperty({ description: 'Device manufacturer', required: false })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({ description: 'Device model', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ description: 'Building detail ID' })
  @IsString()
  buildingDetailId: string;

  @ApiProperty({ description: 'Contract ID', required: false })
  @IsString()
  @IsOptional()
  contract_id?: string;
} 