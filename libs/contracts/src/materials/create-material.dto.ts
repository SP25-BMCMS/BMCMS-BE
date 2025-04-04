import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ 
        description: 'Name of the material',
        type: String,
        required: true,
        example: 'Vữa trét tường'
    })
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ 
        description: 'Description of the material',
        type: String,
        required: false,
        example: 'Dùng để vá các vết nứt nhỏ, nứt chân chim trên tường'
    })
    description?: string;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    @ApiProperty({ 
        description: 'Unit price of the material',
        type: Number,
        required: true,
        example: 50000.00
    })
    unit_price: number;

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    @ApiProperty({ 
        description: 'Stock quantity of the material',
        type: Number,
        required: true,
        example: 100
    })
    stock_quantity: number;
} 