import { ApiProperty } from '@nestjs/swagger'
import { DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-schedule'

export class MaintenanceCycleDto {
  @ApiProperty({ description: 'The unique identifier of the maintenance cycle' })
  cycle_id: string

  @ApiProperty({ description: 'Type of device', enum: DeviceType })
  device_type: DeviceType

  @ApiProperty({ description: 'Frequency of maintenance', enum: Frequency })
  frequency: Frequency

  @ApiProperty({ description: 'Basis for maintenance', enum: MaintenanceBasis })
  basis: MaintenanceBasis


} 