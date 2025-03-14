import { ApiProperty } from '@nestjs/swagger';
import { $Enums, WorkLogStatus } from '@prisma/client-Task';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkLogDto {
  // @IsNotEmpty()
  // @IsUUID()
  // task_id: string;

  // @IsNotEmpty()
  // @IsString()
  // title: string;

  // @IsNotEmpty()
  // @IsString()
  // description: string;
  
  //   @IsOptional()
  //   status?: $Enums.WorkLogStatus;
    
  @ApiProperty({
    description: 'The ID of the task associated with the work log',
    type: String,
    example: 'd1b0cd4c-1e76-4d7f-a0d4-81b32e5101cd',
  })
  @IsNotEmpty()
  @IsUUID()
  task_id: string;

  @ApiProperty({
    description: 'The title of the work log',
    type: String,
    example: 'Task 1 work log',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'A detailed description of the work log',
    type: String,
    example: 'This is a description of the work log related to Task 1.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The status of the work log (optional)',
    enum: WorkLogStatus,  // Liên kết enum với status
    example: WorkLogStatus.CANCELLED +"INIT_INSPECTION,WAIT_FOR_DEPOSIT,EXECUTE_CRACKS,CONFIRM_NO_PENDING_ISSUES,FINAL_REVIEW,CANCELLED",
    required: false,
  })
  @IsOptional()
  status?: WorkLogStatus;
}