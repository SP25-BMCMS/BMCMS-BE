import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-Schedule';

export class UpdateMaintenanceCycleDto {
  @IsOptional()
  @IsEnum(DeviceType)
  @ApiProperty({
    description: 'Type of device',
    enum: DeviceType,
    example: DeviceType.Elevator,
    required: false,
  })
  device_type?: DeviceType;

  @IsOptional()
  @IsEnum(Frequency)
  @ApiProperty({
    description: 'Frequency of maintenance',
    enum: Frequency,
    example: Frequency.Monthly,
    required: false,
  })
  frequency?: Frequency;

  @IsOptional()
  @IsEnum(MaintenanceBasis)
  @ApiProperty({
    description: 'Basis for maintenance',
    enum: MaintenanceBasis,
    example: MaintenanceBasis.ManufacturerRecommendation,
    required: false,
  })
  basis?: MaintenanceBasis;
} 