import { ApiProperty } from '@nestjs/swagger';
import { CrackType } from '@prisma/client-building';

export class CrackRecordDto {
  @ApiProperty({ description: 'Unique identifier of the crack record' })
  crackRecordId: string;

  @ApiProperty({ description: 'Location detail ID where the crack is found' })
  locationDetailId: string;

  @ApiProperty({ description: 'Type of crack', enum: CrackType })
  crackType: CrackType;

  @ApiProperty({ description: 'Length of the crack' })
  length: number;

  @ApiProperty({ description: 'Width of the crack' })
  width: number;

  @ApiProperty({ description: 'Depth of the crack', required: false })
  depth?: number;

  @ApiProperty({ description: 'Description of the crack', required: false })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
} 