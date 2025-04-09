import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { $Enums, AssignmentStatus } from '@prisma/client-Task';

export class UpdateStatusCreateWorklogDto {
    @ApiProperty({
        description: 'New status for the task assignment',
        enum: AssignmentStatus,
        example: 'InFixing|Pending|Verified|Unverified|Fixed|Confirmed|Reassigned'
    })
    @IsEnum($Enums.AssignmentStatus)
    @IsNotEmpty()
    status: $Enums.AssignmentStatus;
} 