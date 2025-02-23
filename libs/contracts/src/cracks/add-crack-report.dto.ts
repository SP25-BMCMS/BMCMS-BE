import { IsEnum, IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { $Enums } from '@prisma/client-cracks';

export class AddCrackReportDto {
  @IsUUID()
  @IsNotEmpty()
  buildingDetailId: string;

  @IsString()
  @IsNotEmpty()
  photoUrl: string;

  @IsEnum($Enums.ReportStatus)
  @IsNotEmpty()
  status: $Enums.ReportStatus;

  @IsInt()
  @IsNotEmpty()
  reportedBy: number;
}