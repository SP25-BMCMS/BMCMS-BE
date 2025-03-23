import { ApiProperty } from '@nestjs/swagger';

export class ScheduleJobResponseDto {
  @ApiProperty()
  schedule_job_id: string;

  @ApiProperty()
  schedule_id: string;

  @ApiProperty()
  run_date: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty()
  building_id: string;
}
