import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-Schedule';

export class CreateMaintenanceCycleDto {
  @IsNotEmpty()
  @IsEnum(DeviceType)
  @ApiProperty({
    description: 'Type of device',
    enum: DeviceType,
    example: DeviceType.Elevator,
  })
  device_type: DeviceType;

  @IsNotEmpty()
  @IsEnum(Frequency)
  @ApiProperty({
    description: 'Frequency of maintenance',
    enum: Frequency,
    example: Frequency.Monthly,
  })
  frequency: Frequency;

  @IsNotEmpty()
  @IsEnum(MaintenanceBasis)
  @ApiProperty({
    description: 'Basis for maintenance',
    enum: MaintenanceBasis,
    example: MaintenanceBasis.ManufacturerRecommendation,
  })
  basis: MaintenanceBasis;
} 