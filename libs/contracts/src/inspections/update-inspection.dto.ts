import { IsUUID, IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { InspectionDto } from './inspection.dto';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInspectionDto extends PartialType(InspectionDto) {

  // @IsOptional()
  // @IsString()
  // description?: string;

  // @IsOptional()
  // @IsString()
  // image_url?: string;

  // @IsOptional()
  // @Type(() => Date)
  // @IsDate()
  // inspection_date?: Date;

  // @IsOptional()
  // @IsUUID()
  // inspected_by?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'A description of the crack or the inspection (optional).',
    example: 'Crack observed along the eastern wall.',
    required: false,
  })
  description?: string; // Optional description

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'URL of the image related to the crack or inspection (optional).',
    example: 'https://example.com/crack-image.jpg',
    required: false,
  })
  image_url?: string; // Optional image URL

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiProperty({
    description: 'The date of the inspection (optional).',
    example: '2025-03-27T12:00:00Z',
    required: false,
  })
  inspection_date?: Date; // Optional inspection date

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'UUID of the person who inspected the crack (optional).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  inspected_by?: string; // Optional UUID of the inspector
}
