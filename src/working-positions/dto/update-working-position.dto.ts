import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkingPositionDto } from './create-working-position.dto';

export class UpdateWorkingPositionDto extends PartialType(CreateWorkingPositionDto) {}
