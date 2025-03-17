import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { CreateCrackDetailDto } from './create-crack-detail.dto';
import { $Enums } from '@prisma/client-cracks';

export class UpdateCrackDetailDto extends PartialType(CreateCrackDetailDto) {

  @IsEnum($Enums.Severity)
  @IsOptional()
  severity?: $Enums.Severity;

  @IsString()
  @IsOptional()
  aiDetectionUrl?: string;
}
