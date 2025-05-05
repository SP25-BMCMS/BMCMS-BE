import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, Min, IsUUID, IsString } from 'class-validator';
import { Status } from '@prisma/client-Task';

export class GetTasksByTypeDto {
    @ApiProperty({
        description: 'Task type (crack, schedule, or all)',
        enum: ['crack', 'schedule', 'all'],
        default: 'all',
        required: false
    })
    @IsEnum(['crack', 'schedule', 'all'])
    @IsOptional()
    taskType?: 'crack' | 'schedule' | 'all' = 'all';

    @ApiProperty({
        description: 'Page number (starting from 1)',
        required: false,
        default: 1,
        minimum: 1
    })
    @IsOptional()
    page?: number = 1;

    @ApiProperty({
        description: 'Items per page',
        required: false,
        default: 10,
        minimum: 1
    })
    @IsOptional()
    limit?: number = 10;

    @ApiProperty({
        description: 'Filter by task status',
        enum: Status,
        required: false
    })
    @IsEnum(Status)
    @IsOptional()
    statusFilter?: Status;
    
    // @ApiProperty({
    //     description: 'Filter tasks by manager ID (UUID of the manager)',
    //     required: false,
    //     example: '0b802cbb-e058-4426-a302-24d5f37f6dcd'
    // })
    @IsString()
    @IsOptional()
    managerId?: string;
} 