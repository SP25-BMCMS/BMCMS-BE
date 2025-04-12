import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateContractDto {
    @ApiProperty({
        description: 'The start date of the contract',
        example: '2023-01-01',
        required: false,
        type: Date
    })
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @ApiProperty({
        description: 'The end date of the contract',
        example: '2024-01-01',
        required: false,
        type: Date
    })
    @IsOptional()
    @IsDateString()
    end_date?: string;

    @ApiProperty({
        description: 'The vendor of the contract',
        example: 'ABC Company',
        required: false
    })
    @IsOptional()
    @IsString()
    vendor?: string;
} 