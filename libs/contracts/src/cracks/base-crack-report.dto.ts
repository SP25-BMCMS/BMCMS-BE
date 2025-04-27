import { $Enums } from '@prisma/client-cracks';
import { Type } from 'class-transformer';
import { CreateCrackDetailDto } from './create-crack-detail.dto';
import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  suppressNotification?: boolean;
}
