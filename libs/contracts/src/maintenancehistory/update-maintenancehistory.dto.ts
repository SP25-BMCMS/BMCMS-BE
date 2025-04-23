import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMaintenanceHistoryDto {
    @ApiProperty({
        description: 'ID của thiết bị cần bảo trì',
        example: 'abc123-def456',
        required: false
    })
    @IsOptional()
    @IsString()
    device_id?: string;

    @ApiProperty({
        description: 'Ngày thực hiện bảo trì',
        example: '2023-12-15',
        required: false
    })
    @IsOptional()
    @IsDateString()
    date_performed?: string;

    @ApiProperty({
        description: 'Mô tả chi tiết công việc bảo trì',
        example: 'Bảo trì định kỳ thiết bị thang máy',
        required: false
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Chi phí bảo trì',
        example: 1500000,
        required: false
    })
    @IsOptional()
    @IsNumber()
    cost?: number;
} 