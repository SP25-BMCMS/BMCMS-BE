import { ApiProperty } from '@nestjs/swagger'
import { DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-schedule'

export class MaintenanceCycleHistoryDto {
  @ApiProperty({
    description: 'Unique identifier for the history record',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  history_id: string

  @ApiProperty({
    description: 'ID of the maintenance cycle this history belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  cycle_id: string

  @ApiProperty({
    description: 'Frequency of maintenance',
    enum: Frequency,
    example: Frequency.Monthly,
  })
  frequency: Frequency

  @ApiProperty({
    description: 'Basis for maintenance',
    enum: MaintenanceBasis,
    example: MaintenanceBasis.ManufacturerRecommendation,
  })
  basis: MaintenanceBasis

  @ApiProperty({
    description: 'Type of device',
    enum: DeviceType,
    example: DeviceType.Elevator,
  })
  device_type: DeviceType

  @ApiProperty({
    description: 'When the change occurred',
    example: '2023-01-01T00:00:00.000Z',
  })
  changed_at: Date

  @ApiProperty({
    description: 'User ID or name who updated the maintenance cycle',
    example: 'user123',
    required: false,
  })
  updated_by?: string

  @ApiProperty({
    description: 'Reason for updating the maintenance cycle',
    example: 'Updated frequency based on new manufacturer guidelines',
    required: false,
  })
  reason?: string
} 