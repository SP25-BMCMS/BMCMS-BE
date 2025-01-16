import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDetailDto } from './create-location-detail.dto';

export class UpdateLocationDetailDto extends PartialType(CreateLocationDetailDto) {}
