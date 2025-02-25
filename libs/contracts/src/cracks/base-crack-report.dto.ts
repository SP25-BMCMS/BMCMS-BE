import { IsUUID, IsString, IsOptional, IsEnum, ValidateNested, IsArray } from 'class-validator';
import { $Enums } from '@prisma/client-cracks';
import { Type } from 'class-transformer';
import { CreateCrackDetailDto } from './create-crack-detail.dto';

export class BaseCrackReportDto {
  @IsUUID()
  @IsOptional()
  buildingDetailId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum($Enums.ReportStatus)
  @IsOptional()
  status?: $Enums.ReportStatus;

}
