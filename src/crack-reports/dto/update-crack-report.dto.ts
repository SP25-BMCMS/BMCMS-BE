import { PartialType } from '@nestjs/mapped-types';
import { CreateCrackReportDto } from './create-crack-report.dto';

export class UpdateCrackReportDto extends PartialType(CreateCrackReportDto) {}
