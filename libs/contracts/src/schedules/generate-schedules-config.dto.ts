import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from 'class-validator';

export class CycleConfigDto {
    @ApiProperty({ description: 'Maintenance cycle ID', example: '0bae50eb-da6e-410d-b4a1-487087885b2d' })
    @IsUUID()
    cycle_id: string;

    @ApiProperty({ description: 'Duration in days for this maintenance cycle', example: 5 })
    @IsPositive()
    duration_days: number;

    @ApiProperty({ description: 'Whether to auto-create tasks for this cycle', example: true, default: true })
    @IsBoolean()
    @IsOptional()
    auto_create_tasks?: boolean;

    @ApiProperty({ description: 'Start date for this maintenance cycle', example: '2025-04-24' })
    @IsDateString()
    start_date: string;
}

export class GenerateSchedulesConfigDto {
    @ApiProperty({ description: 'Configuration for each maintenance cycle', type: [CycleConfigDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CycleConfigDto)
    cycle_configs: CycleConfigDto[];

    @ApiProperty({ description: 'Building details IDs to create schedule jobs for', type: [String] })
    @IsArray()
    @IsString({ each: true })
    buildingDetails: string[];
} 