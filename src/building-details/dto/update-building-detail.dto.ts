import { PartialType } from '@nestjs/mapped-types';
import { CreateBuildingDetailDto } from './create-building-detail.dto';

export class UpdateBuildingDetailDto extends PartialType(CreateBuildingDetailDto) {}
