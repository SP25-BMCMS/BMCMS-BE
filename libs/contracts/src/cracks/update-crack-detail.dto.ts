import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { CreateCrackDetailDto } from './create-crack-detail.dto';

export class UpdateCrackDetailDto extends PartialType(CreateCrackDetailDto) {
  @IsOptional()
  verifiedBy?: number;
}