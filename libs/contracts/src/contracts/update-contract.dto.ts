import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateContractDto {
    @ApiProperty({
        description: 'The start date of the contract',
        example: '2023-01-01',
        required: false,
        type: Date
    })
    @IsOptional()
    start_date?: string;

    @ApiProperty({
        description: 'The end date of the contract',
        example: '2024-01-01',
        required: false,
        type: Date
    })
    @IsOptional()
    end_date?: string;

    @ApiProperty({
        description: 'The vendor of the contract',
        example: 'ABC Company',
        required: false
    })
    @IsOptional()
    vendor?: string;
} 