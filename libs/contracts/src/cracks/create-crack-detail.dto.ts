import { IsString, IsEnum, IsOptional } from 'class-validator';
import { $Enums } from '@prisma/client-cracks';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCrackDetailDto {
  // ❌ Xóa `@IsUUID()` vì ID này được backend tự động gán
  // crackReportId?: string; // ✅ Backend sẽ tự động thêm

  // @IsString()
  // photoUrl: string;

  // @IsEnum($Enums.Severity)
  // @IsOptional()
  // severity?: $Enums.Severity = $Enums.Severity.Unknown; // ✅ Mặc định Unknown

  // @IsString()
  // @IsOptional()
  // aiDetectionUrl?: string; // ✅ Nếu không có, sẽ lấy từ `photoUrl`
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The unique identifier for the crack report (automatically added by backend).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  crackReportId?: string; // ✅ Backend sẽ tự động thêm

  @IsString()
  @ApiProperty({
    description: 'The URL of the photo related to the crack.',
    example: 'https://example.com/crack-photo.jpg',
  })
  photoUrl: string; // The URL for the crack photo

  @IsEnum($Enums.Severity)
  @IsOptional()
  @ApiProperty({
    description: 'The severity of the crack.',
    enum: $Enums.Severity,
    example: 'Unknown'+'Low'+'Medium'+'High',
    required: false,
  })
  severity?: $Enums.Severity = $Enums.Severity.Unknown;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'AI detection URL for analyzing the crack.',
    example: 'https://example.com/ai-detection-result',
    required: false,
  })
  aiDetectionUrl?: string; // Optional AI detection URL
}
