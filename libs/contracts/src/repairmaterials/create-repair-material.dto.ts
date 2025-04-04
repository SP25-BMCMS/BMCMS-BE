import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsPositive,
    Min,
    IsDecimal
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class    CreateRepairMaterialDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ 
        description: 'ID of the task associated with ấdasdsadsadasdsadadsdsdthis repair material',
        type: String,
        required: true,
        example: '123e4567-e89b-12d3-a456-426614ádasdsadsadasdsadadsdsd174000'
    })
    task_id: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ 
        description: 'ID of the material being used',
        type: String,
        required: true,
        example: '123e4567-e89b-12d3-a456-426614174001'
    })
    material_id: string;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    @ApiProperty({ 
        description: 'Quantity of material needed',
        type: Number,
        required: true,
        example: 5,
        minimum: 1
    })
    quantity: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    @ApiProperty({ 
        description: 'Cost per unit of the material',
        type: Number,
        required: true,
        example: 100.50,
        minimum: 0,
        format: 'float'
    })
    unit_cost: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    @ApiProperty({ 
        description: 'Total cost of the material (quantity * unit_cost)',
        type: Number,
        required: true,
        example: 502.50,
        minimum: 0,
        format: 'float'
    })
    total_cost: number;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ 
        description: 'ID of the inspection associated with this repair',
        type: String,
        required: true,
        example: '123e4567-e89b-12d3-a456-426614174002'
    })
    inspection_id: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ 
        description: 'Additional description or notes about the repair material',
        type: String,
        required: false,
        example: 'High-quality cement for structural repair'
    })
    description?: string;
} 