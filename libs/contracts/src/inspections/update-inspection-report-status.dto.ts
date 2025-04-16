import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

enum ReportStatus {
  NoPending = 'NoPending',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  AutoApproved = 'AutoApproved'
}

export class UpdateInspectionReportStatusDto {
  @ApiProperty({
    description: 'Status of the inspection report',
    enum: ReportStatus,
    example: 'Approved',
    required: true
  })
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  report_status: ReportStatus;
} 