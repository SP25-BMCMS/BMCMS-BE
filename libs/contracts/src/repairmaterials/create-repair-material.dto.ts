import {
    IsString,
    IsNumber,
    IsOptional,
    IsDecimal,
    Min,
    IsPositive
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRepairMaterialDto {
    @IsString()
    task_id: string;

    @IsString()
    material_id: string;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    quantity: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    unit_cost: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Type(() => Number)
    total_cost: number;

    @IsString()
    inspection_id: string;

    @IsOptional()
    @IsString()
    description?: string;
} 