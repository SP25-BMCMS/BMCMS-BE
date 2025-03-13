import { IsUUID, IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { InspectionDto } from './inspection.dto';
import { InspectionStatus } from '@prisma/client-Task';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class UpdateInspectionDto extends PartialType(InspectionDto) {

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  inspection_date?: Date;

  @IsOptional()
  @IsUUID()
  inspected_by?: string;
}
