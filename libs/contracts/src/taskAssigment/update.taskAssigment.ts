// update-task-assignment.dto.ts
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { AssignmentStatus } from '@prisma/client-Task';  // Assuming AssignmentStatus is an enum in Prisma

export class UpdateTaskAssignmentDto {
  @IsUUID()
  @IsOptional()
  task_id: string;

  @IsUUID()
  @IsOptional()
  employee_id: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsEnum(AssignmentStatus)
  @IsOptional()
  status: AssignmentStatus;
}
