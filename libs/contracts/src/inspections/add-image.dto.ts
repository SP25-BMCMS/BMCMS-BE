import { IsString, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddImageToInspectionDto {
  @ApiProperty({
    description: 'ID of the inspection',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  inspection_id: string;

  @ApiProperty({
    description: 'URLs of the images to add',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    required: true,
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  image_urls: string[];
} 