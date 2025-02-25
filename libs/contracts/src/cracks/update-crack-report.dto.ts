import { PartialType } from '@nestjs/mapped-types';
import { BaseCrackReportDto } from './base-crack-report.dto';


export class UpdateCrackReportDto extends PartialType(BaseCrackReportDto) {
}
