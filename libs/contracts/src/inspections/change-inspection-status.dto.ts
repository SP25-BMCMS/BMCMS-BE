import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InspectionStatus } from '@prisma/client-Task';

export class ChangeInspectionStatusDto {
  @ApiProperty({
    description: 'ID of the inspection',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  inspection_id: string;

  @ApiProperty({
    description: 'New status of the inspection',
    enum: InspectionStatus,
    example: InspectionStatus.Verify,
    required: true
  })
  @IsEnum(InspectionStatus)
  @IsNotEmpty()
  status: InspectionStatus;
} 