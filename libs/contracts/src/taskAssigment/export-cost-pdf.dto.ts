import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExportCostPdfDto {
    @ApiProperty({
        description: 'Task ID to export cost information',
        example: '12345678-1234-1234-1234-123456789012'
    })
    @IsString()
    @IsNotEmpty()
    task_id: string;
} 