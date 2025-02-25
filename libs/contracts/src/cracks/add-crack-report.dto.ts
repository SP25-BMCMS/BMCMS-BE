import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateNested, IsArray, IsOptional } from 'class-validator';
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

  @IsEnum($Enums.ReportStatus)
  @IsOptional()
  status?: $Enums.ReportStatus = $Enums.ReportStatus.Reported; // Mặc định Reported

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCrackDetailDto)
  crackDetails: CreateCrackDetailDto[];
}
