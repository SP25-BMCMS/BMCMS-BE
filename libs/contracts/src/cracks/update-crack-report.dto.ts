import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsEnum, IsInt, IsUUID } from 'class-validator';
import { AddCrackReportDto } from './add-crack-report.dto';
import { $Enums } from '@prisma/client-cracks';

export class UpdateCrackReportDto extends PartialType(AddCrackReportDto) {
  @IsUUID()
  @IsOptional()
  buildingDetailId?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsEnum($Enums.ReportStatus)
  @IsOptional()
  status: $Enums.ReportStatus;

  @IsInt()
  @IsOptional()
  reportedBy?: number;
}