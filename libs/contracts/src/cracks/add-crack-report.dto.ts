import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateNested, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Severity } from '@prisma/client-cracks';
import { $Enums } from '@prisma/client-cracks';

export class CrackDetailDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsString()
  @IsNotEmpty()
  file: string; // Base64 string

  @ApiProperty({ enum: Severity, required: false })
  @IsOptional()
  severity?: Severity;
}

// Define a custom type to handle multer files with base64 buffers
export interface ProcessedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: string | Buffer; // Can be string (base64) or Buffer
  destination?: string;
  filename?: string;
  path?: string;
}

export class AddCrackReportDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The unique identifier of the building detail.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  buildingId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Description of the building asset.',
    example: 'Crack found in the wall.',
  })
  description: string;

  @IsBoolean()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @ApiProperty({
    description: 'Indicates whether the building asset is a private asset.',
    example: true,
  })
  isPrivatesAsset: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Position of the crack or asset in the building.',
    example: 'rainbow/s106/15/left',
    required: false,
  })
  position?: string;

  @IsEnum($Enums.ReportStatus)
  @IsOptional()
  status?: $Enums.ReportStatus = $Enums.ReportStatus.Pending;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Array of crack images',
  })
  files: ProcessedFile[];
}
