import { IsUUID, IsString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { $Enums } from '@prisma/client-cracks';

export class CreateCrackDetailDto {
  @IsUUID()
  crackId: string;

  @IsString()
  photoUrl: string;

  @IsString()
  description: string;

  @IsEnum($Enums.CrackStatus)
  status: $Enums.CrackStatus;

  @IsEnum($Enums.Severity)
  severity: $Enums.Severity;

  @IsInt()
  reportedBy: number;

  @IsInt()
  verifiedBy?: number;
}
