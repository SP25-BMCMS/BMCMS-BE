import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { DeviceType } from '@prisma/client-schedule'

export class AutoMaintenanceScheduleDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'Name of the maintenance schedule',
        example: 'Elevator Maintenance Schedule'
    })
    schedule_name: string

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Description of the maintenance schedule',
        example: 'Automatic maintenance schedule for elevators',
        required: false
    })
    description?: string

    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({
        description: 'ID of the maintenance cycle to use as template',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
    })
    cycle_id: string

    @IsNotEmpty()
    @IsArray()
    @ApiProperty({
        description: 'IDs of building details to include in the maintenance schedule',
        example: ['d290f1ee-6c54-4b01-90e6-d701748f0851', 'e290f1ee-6c54-4b01-90e6-d701748f0852'],
        type: [String]
    })
    buildingDetailIds: string[]

    @IsOptional()
    @ApiProperty({
        description: 'Start date of the maintenance schedule',
        example: '2025-01-01T00:00:00.000Z',
        required: false
    })
    start_date?: Date

    @IsOptional()
    @ApiProperty({
        description: 'End date of the maintenance schedule',
        example: '2025-01-01T00:00:00.000Z',
        required: false
    })
    end_date?: Date

    @IsOptional()
    @IsString()
    // @ApiProperty({
    //     description: 'ID of the manager creating this schedule (automatically set from token)',
    //     example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    //     required: false
    // })
    managerId?: string
} 