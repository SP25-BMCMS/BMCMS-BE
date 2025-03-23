// update-areas.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateAreaDto {
  // @IsString()
  // @IsOptional()
  // name?: string;

  // @IsOptional()
  // @IsString()
  // description?: string;
  @ApiProperty({
    description: 'Name of the building (optional)',
    type: String,
    example: 'Skyline Tower',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the building (optional)',
    type: String,
    example: 'A modern skyscraper with 25 floors.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}