import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsPositive,
    Min,
    IsDecimal,
    IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class    AddMaterialsToInspectionDto {
    // @ApiProperty({ 
    //     description: 'ID of the task associated with ấdasdsadsadasdsadadsdsdthis repair material',
    //     type: String,
    //     required: true,
    //     example: '123e4567-e89b-12d3-a456-426614ádasdsadsadasdsadadsdsd174000'
    // })
    // task_id: string;

    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({ 
        description: 'ID of the material',
        type: String,
        required: true,
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    material_id: string;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    @ApiProperty({ 
        description: 'Quantity of the material needed',
        type: Number,
        required: true,
        example: 5
    })
    quantity: number;

} 