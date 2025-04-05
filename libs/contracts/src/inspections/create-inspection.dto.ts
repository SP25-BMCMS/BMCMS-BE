import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDecimal } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InspectionStatus } from '@prisma/client-Task';

export class CreateInspectionDto {
  @ApiProperty({
    description: 'ID of the task assignment',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  task_assignment_id: string;

  @ApiProperty({
    description: 'ID of the user who performed the inspection',
    example: 'user123',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  inspected_by: string;

  
  @IsString()
  @IsOptional()
  image_url?: string;

 
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Status of the inspection',
    enum: InspectionStatus,
    example: InspectionStatus.Notyetverify,
    required: false
  })
  @IsEnum(InspectionStatus)
  @IsOptional()
  status?: InspectionStatus;


  @IsDecimal()
  @IsOptional()
  total_cost?: number;


  @IsString()
  @IsOptional()
  locationDetailId?: string;
} 