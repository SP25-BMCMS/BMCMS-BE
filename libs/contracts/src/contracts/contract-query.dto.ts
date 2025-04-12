import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';


export class ContractQueryDto {
    @ApiProperty({
        description: 'Page number (starts from 1)',
        required: false,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page',
        required: false,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;

    @ApiProperty({
        description: 'Search term to filter vendor name',
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;


} 