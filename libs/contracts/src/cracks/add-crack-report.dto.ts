import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateNested, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { $Enums } from '@prisma/client-cracks';
import { Type } from 'class-transformer';
import { CreateCrackDetailDto } from './create-crack-detail.dto';

export class AddCrackReportDto {
  @IsUUID()
  @IsNotEmpty()
  buildingDetailId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsNotEmpty()
  isPrivatesAsset: boolean;

  @IsString()
  @IsOptional()
  position?: string;

  @IsEnum($Enums.ReportStatus)
  @IsOptional()
  status?: $Enums.ReportStatus = $Enums.ReportStatus.Pending; // Mặc định Reported

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCrackDetailDto)
  crackDetails: CreateCrackDetailDto[];
}
