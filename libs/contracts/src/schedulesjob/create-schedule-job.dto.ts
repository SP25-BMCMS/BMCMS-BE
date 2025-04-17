import { ApiProperty } from '@nestjs/swagger'
import { $Enums, ScheduleJobStatus } from '@prisma/client-schedule'
import { IsString, IsNotEmpty, IsUUID, IsInt, IsOptional, IsDate } from 'class-validator'
export class CreateScheduleJobDto {

  @ApiProperty({
    description: 'The ID of the schedule associated with the job (optional)',
    type: String,
    example: 'd1b0cd4c-1e76-4d7f-a0d4-81b32e5101cd',
    required: false,
  })
  @IsOptional()
  schedule_id?: string

  // @ApiProperty({
  //   description: 'The scheduled run date of the job (optional)',
  //   type: Date,
  //   example: '2025-03-15T10:00:00Z',
  //   required: false,
  // })
  @ApiProperty({ description: 'Start date of the schedule', required: false, type: Date })  // Optional start date

  @IsOptional()

  run_date?: Date

  @ApiProperty({
    description: 'The status of the schedule job (optional)',
    enum: ['Pending', 'InProgress', 'Completed', 'Cancel'],
    example: 'InProgress',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: $Enums.ScheduleJobStatus

  @ApiProperty({
    description: 'The ID of the building associated with the job (optional)',
    type: String,
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsString()
  buildingDetailId?: string

  @ApiProperty({
    description: 'The ID of the Inspection  ',
    type: String,
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsString()
  inspectionId?: string
}
