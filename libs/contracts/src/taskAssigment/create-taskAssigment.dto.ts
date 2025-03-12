// create-task-assignment.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { AssignmentStatus } from '@prisma/client-Task';  // Assuming AssignmentStatus is an enum in Prisma
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskAssignmentDto {
  @IsUUID()
  @ApiProperty({ description: 'The ID of the task', type: String })  // Adding description for task_id
  task_id: string;

  @IsUUID()
  @ApiProperty({ description: 'The ID of the employee assigned to the task', type: String })  // Description for employee_id
  employee_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'A description for the task assignment', type: String })  // Description for the task description
  description: string;

  @IsEnum(AssignmentStatus)
  @ApiProperty({ description: 'The current status of the task assignment', enum: AssignmentStatus })  // Enum for the status field
  status: AssignmentStatus;
}
