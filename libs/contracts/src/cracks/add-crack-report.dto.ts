import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateNested, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { $Enums } from '@prisma/client-cracks';
import { Type } from 'class-transformer';
import { CreateCrackDetailDto } from './create-crack-detail.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AddCrackReportDto {
  // @IsUUID()
  // @IsNotEmpty()
  // buildingDetailId: string;

  // @IsString()
  // @IsNotEmpty()
  // description: string;

  // @IsBoolean()
  // @IsNotEmpty()
  // isPrivatesAsset: boolean;

  // @IsString()
  // @IsOptional()
  // position?: string;

  // @IsEnum($Enums.ReportStatus)
  // @IsOptional()
  // status?: $Enums.ReportStatus = $Enums.ReportStatus.Pending; // Mặc định Reported

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => CreateCrackDetailDto)
  // crackDetails: CreateCrackDetailDto[];
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The unique identifier of the building detail.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  buildingDetailId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Description of the building asset.',
    example: 'Crack found in the wall.',
  })
  description: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Indicates whether the building asset is a private asset.',
    example: true,
  })
  isPrivatesAsset: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Position of the crack or asset in the building.',
    example: 'Wall A',
    required: false,
  })
  position?: string;

  @IsEnum($Enums.ReportStatus)
  @IsOptional()
  @ApiProperty({
    description: 'The status of the report.',
    enum: $Enums.ReportStatus,
    example: 'Pending'+'InProgress'+'InFixing'+'Reviewing'+'Rejected'+'Completed',
    required: false,
  })
  status?: $Enums.ReportStatus = $Enums.ReportStatus.Pending;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCrackDetailDto)
  @ApiProperty({
    description: 'Details of the cracks reported in the building.',
    type: [CreateCrackDetailDto],
    example: [
      { crackType: 'Vertical', severity: 'High' },
      { crackType: 'Horizontal', severity: 'Medium' },
    ],
  })
  crackDetails: CreateCrackDetailDto[];

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Cover image URL of the building (optional)',
    type: String,
    example: 'https://example.com/building-image.jpg',
    required: false,
  })
  coverImageUrl?: string;
}
