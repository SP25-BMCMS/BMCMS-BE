import { PartialType } from '@nestjs/mapped-types';
import { CreateCrackDetailDto } from './create-crack-detail.dto';

export class UpdateCrackDetailDto extends PartialType(CreateCrackDetailDto) {}
