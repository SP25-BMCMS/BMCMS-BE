import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client-schedule'

import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator'


export class UpdateScheduleJobStatusDto {

  @IsUUID()
  @IsOptional()
  schedule_job_id: string

  @ApiProperty({
    description: 'The status of the schedule job',
    type: String,
    enum: ['Pending', 'InProgress', 'Completed', 'Cancel'],
    example: 'InProgress',
  })
  @IsNotEmpty()
  status: $Enums.ScheduleJobStatus
}
