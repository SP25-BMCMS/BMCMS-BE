// task-assignment-response.dto.ts
import { IsString, IsEnum, IsUUID, IsDate } from 'class-validator';
import { AssignmentStatus } from '@prisma/client-Task';  // Assuming AssignmentStatus is an enum in Prisma

export class TaskAssignmentResponseDto {
  @IsUUID()
  assignment_id: string;

  @IsUUID()
  task_id: string;

  @IsUUID()
  employee_id: string;

  @IsString()
  description: string;

  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;
}
