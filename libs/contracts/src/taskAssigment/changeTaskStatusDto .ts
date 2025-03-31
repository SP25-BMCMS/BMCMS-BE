// // change-task-status.dto.ts
// import { IsEnum } from 'class-validator';
// import { Status } from '@prisma/client-Task';  // Assuming Status is an enum in Prisma

// export class ChangeTaskStatusDto {
//   @IsEnum(Status)
//   status: Status;
// }

// change-task-assignment-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { $Enums, AssignmentStatus } from '@prisma/client-Task';  // Assuming Status is an enum in Prisma


export class ChangeTaskAssignmentStatusDto {
  @ApiProperty({
    description: 'Assignment ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  assignment_id: string;

  @ApiProperty({
    description: 'New status for the task assignment',
    enum: AssignmentStatus,
    example: 'InFixing'
  })
  @IsEnum($Enums.AssignmentStatus)
  @IsNotEmpty()
  status: $Enums.   AssignmentStatus;
}
