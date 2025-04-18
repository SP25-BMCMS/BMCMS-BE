import { ApiProperty } from '@nestjs/swagger';

export enum DeviceType {
  SENSOR = 'SENSOR',
  CAMERA = 'CAMERA',
  CONTROLLER = 'CONTROLLER',
  OTHER = 'OTHER'
}

export class DeviceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: DeviceType })
  type: DeviceType;

  @ApiProperty()
  buildingDetailId: string;

  @ApiProperty()
  contractId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DeviceListResponseDto {
  @ApiProperty({ type: [DeviceResponseDto] })
  items: DeviceResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
} 