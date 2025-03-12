// update-task-assignment.dto.ts
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { AssignmentStatus } from '@prisma/client-Task';  // Assuming AssignmentStatus is an enum in Prisma
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskAssignmentDto {
  @IsUUID()
  @IsOptional()
  @ApiProperty({ description: 'The ID of the task', required: false, type: String })  // Adding description and type
  task_id: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ description: 'The ID of the employee assigned to the task', required: false, type: String })  // Description for employee_id
  employee_id: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'A description for the task assignment', required: false, type: String })  // Adding description
  description: string;

  @IsEnum(AssignmentStatus)
  @IsOptional()
  @ApiProperty({ description: 'The current status of the task assignment', required: false, enum: AssignmentStatus })  // Enum for status
  status: AssignmentStatus;
}
