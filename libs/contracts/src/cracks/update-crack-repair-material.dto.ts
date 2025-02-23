import { PartialType } from '@nestjs/mapped-types';
import { CreateCrackRepairMaterialDto } from './create-crack-repair-material.dto';

export class UpdateCrackRepairMaterialDto extends PartialType(CreateCrackRepairMaterialDto) {}
