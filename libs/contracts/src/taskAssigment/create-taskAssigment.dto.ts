// create-task-assignment.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { AssignmentStatus } from '@prisma/client-Task';  // Assuming AssignmentStatus is an enum in Prisma

export class CreateTaskAssignmentDto {
  @IsUUID()
  task_id: string;

  @IsUUID()
  employee_id: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;
}
