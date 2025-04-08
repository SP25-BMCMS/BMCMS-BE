import { IsString, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMaterialDto {
    @IsOptional()
    @IsString()
    @ApiProperty({ 
        description: 'Name of the material',
        type: String,
        required: false,
        example: 'Vữa trét tường'
    })
    name?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ 
        description: 'Description of the material',
        type: String,
        required: false,
        example: 'Dùng để vá các vết nứt nhỏ, nứt chân chim trên tường'
    })
    description?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    @ApiProperty({ 
        description: 'Unit price of the material',
        type: Number,
        required: false,
        example: 50000.00
    })
    unit_price?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    @ApiProperty({ 
        description: 'Stock quantity of the material',
        type: Number,
        required: false,
        example: 100
    })
    stock_quantity?: number;
} 