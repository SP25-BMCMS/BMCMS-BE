import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDecimal, IsArray, IsInt, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LocationDetailDto {
  @ApiProperty({
    description: 'ID of the building detail',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    type: String
  })
  @IsString()
  @IsOptional()
  buildingDetailId?: string;

  @ApiProperty({
    description: 'Room number for location detail',
    example: 'Room 101',
    required: false,
    type: String
  })
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @ApiProperty({
    description: 'Floor number for location detail',
    example: 1,
    required: false,
    type: Number
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  floorNumber?: number;

  @ApiProperty({
    description: 'Area type for location detail',
    example: 'Floor',
    required: false,
    type: String,
    enum: ['Floor', 'Wall', 'Ceiling', 'column', 'Other']
  })
  @IsString()
  @IsOptional()
  areaType?: string;

  @ApiProperty({
    description: 'Description of the location detail',
    example: 'This is a description of the location',
    required: false,
    type: String
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class RepairMaterialDto {
  @ApiProperty({
    description: 'ID of the material',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
    type: String
  })
  @IsUUID()
  @IsNotEmpty()
  materialId: string;

  @ApiProperty({
    description: 'Quantity of the material',
    example: 5,
    required: true,
    type: Number
  })
  @IsInt()
  @IsNotEmpty()
  quantity: number;
}

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
    description: 'ID of the user who performed the inspection (set automatically from auth token)',
    example: 'user123',
    required: false,
    readOnly: true
  })
  @IsString()
  @IsOptional()
  inspected_by?: string;

  @IsArray()
  @IsOptional()
  image_urls?: string[];

  @ApiProperty({
    description: 'Description of the inspection',
    example: 'This is a description of the inspection',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @IsDecimal()
  @IsOptional()
  total_cost?: number;

  @ApiProperty({
    description: 'Files to upload (handled automatically by controller)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary'
    },
    required: false
  })
  @IsOptional()
  files?: any[];

  @ApiProperty({
    description: 'Additional location details for this inspection',
    type: [LocationDetailDto],
    required: false,
    example: [
      {
        roomNumber: 'Room 101',
        floorNumber: 1,
        areaType: 'Floor',
        description: 'Main living area'
      },
      {
        roomNumber: 'Room 102',
        floorNumber: 1,
        areaType: 'Wall',
        description: 'Kitchen wall'
      }
    ]
  })
  @IsOptional()
  @Type(() => LocationDetailDto)
  additionalLocationDetails?: LocationDetailDto[];

  @ApiProperty({
    description: 'List of repair materials',
    example: [
      {
        materialId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 5
      },
      {
        materialId: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 3
      }
    ],
    required: false,
    type: [RepairMaterialDto]
  })
  @Type(() => RepairMaterialDto)
  @IsOptional()
  repairMaterials?: RepairMaterialDto[];
} 