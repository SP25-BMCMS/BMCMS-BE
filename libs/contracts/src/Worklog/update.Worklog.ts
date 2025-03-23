import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { $Enums, WorkLogStatus } from '@prisma/client-Task'; // Assuming $Enums contains WorkLogStatus enum

export class UpdateWorkLogDto {
  @ApiProperty({
    description: 'The unique identifier of the work log',
    example: '5ec2f597-45d0-40f9-b281-ad602e5296b6',
  })
  @IsUUID()
  worklog_id: string;

  @ApiProperty({
    description: 'Title of the work log',
    example: 'Work log for inspection',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Description of the work log',
    example: 'Details of the task being performed',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The status of the work log (optional)',
    enum: WorkLogStatus,  // Liên kết enum với status
    example: WorkLogStatus.CANCELLED +"INIT_INSPECTION,WAIT_FOR_DEPOSIT,EXECUTE_CRACKS,CONFIRM_NO_PENDING_ISSUES,FINAL_REVIEW,CANCELLED",
    required: false,
  })
  @IsOptional()
  @IsOptional()
  status?: $Enums.WorkLogStatus;
}