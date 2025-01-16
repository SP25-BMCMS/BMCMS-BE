import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleJobDto } from './create-schedule-job.dto';

export class UpdateScheduleJobDto extends PartialType(CreateScheduleJobDto) {}
