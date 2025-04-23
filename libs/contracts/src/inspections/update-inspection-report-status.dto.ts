import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export enum ReportStatus {
  NoPending = 'NoPending',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  AutoApproved = 'AutoApproved'
}

export class UpdateInspectionReportStatusDto {
  @ApiProperty({ description: 'ID of the inspection' })
  @IsString()
  @IsNotEmpty()
  inspection_id: string;

  @ApiProperty({ 
    description: 'New status of the inspection report',
    enum: ReportStatus
  })
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  report_status: ReportStatus;

  @ApiProperty({ description: 'ID of the manager updating the status' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Reason for the status change' })
  @IsString()
  @IsNotEmpty()
  reason: string;
} 