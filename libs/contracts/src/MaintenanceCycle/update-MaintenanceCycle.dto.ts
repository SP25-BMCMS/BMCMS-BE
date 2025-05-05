import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-schedule'

export class UpdateMaintenanceCycleDto {
  @IsOptional()
  @IsEnum(DeviceType)
  @ApiProperty({
    description: 'Type of device',
    enum: DeviceType,
    example: DeviceType.Elevator,
    required: false,
  })
  device_type?: DeviceType

  @IsOptional()
  @IsEnum(Frequency)
  @ApiProperty({
    description: 'Frequency of maintenance',
    enum: Frequency,
    example: Frequency.Monthly,
    required: false,
  })
  frequency?: Frequency

  @IsOptional()
  @IsEnum(MaintenanceBasis)
  @ApiProperty({
    description: 'Basis for maintenance',
    enum: MaintenanceBasis,
    example: MaintenanceBasis.ManufacturerRecommendation,
    required: false,
  })
  basis?: MaintenanceBasis

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'User ID or name who updated the maintenance cycle',
    example: 'user123',
    required: false,
  })
  updated_by?: string

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Reason for updating the maintenance cycle',
    example: 'Updated frequency based on new manufacturer guidelines',
    required: false,
  })
  reason?: string
} 