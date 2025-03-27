import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { CreateCrackDetailDto } from './create-crack-detail.dto';
import { $Enums } from '@prisma/client-cracks';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCrackDetailDto extends PartialType(CreateCrackDetailDto) {

  // @IsEnum($Enums.Severity)
  // @IsOptional()
  // severity?: $Enums.Severity;

  // @IsString()
  // @IsOptional()
  // aiDetectionUrl?: string;
  @IsEnum($Enums.Severity)
  @IsOptional()
  @ApiProperty({
    description: 'The severity of the crack (optional).',
    enum: $Enums.Severity,
    example: 'Unknown'+'Low'+'Medium'+'High',
    required: false,
  })
  severity?: $Enums.Severity; 

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'AI detection URL for analyzing the crack (optional).',
    example: 'https://example.com/ai-detection-result',
    required: false,
  })
  aiDetectionUrl?: string; // AI detection URL (optional)
}
