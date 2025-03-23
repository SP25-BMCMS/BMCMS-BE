import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client-Task'; // Assuming $Enums contains WorkLogStatus enum

export class UpdateWorkLogStatusDto {

  // @ApiProperty({
  //   description: 'The unique identifier of the work log',
  //   example: '5ec2f597-45d0-40f9-b281-ad602e5296b6',
  // })
  @IsUUID()
  @IsOptional()
  worklog_id: string;
  

  @ApiProperty({
    description: 'INIT_INSPECTION ,WAIT_FOR_DEPOSIT,EXECUTE_CRACKS,ONFIRM_NO_PENDING_ISSUES,CONFIRM_NO_PENDING_ISSUES,FINAL_REVIEW,CANCELLED',
    enum: $Enums.WorkLogStatus,
    enumName: 'WorkLogStatus',
    required: false,
    example: $Enums.WorkLogStatus.INIT_INSPECTION +"INIT_INSPECTION ,WAIT_FOR_DEPOSIT,EXECUTE_CRACKS,ONFIRM_NO_PENDING_ISSUES,CONFIRM_NO_PENDING_ISSUES,FINAL_REVIEW,CANCELLED",
  })
  @IsOptional()
  status?: $Enums.WorkLogStatus;
}