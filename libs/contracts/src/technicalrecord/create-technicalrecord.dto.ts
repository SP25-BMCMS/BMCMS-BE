import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator'

export class CreateTechnicalRecordDto {
    @ApiProperty({
        description: 'The ID of the device this technical record belongs to',
        example: 'b3a2c1d0-e9f8-4a6b-8c7d-1e2f3a4b5c6d',
    })
    @IsNotEmpty()
    @IsString()
    device_id: string

    @ApiProperty({
        description: 'The name of the file',
        example: 'maintenance_manual.pdf',
    })
    file_name: string

    @ApiProperty({
        description: 'The type of the technical document',
        example: 'manual',
    })
    @IsNotEmpty()
    @IsString()
    file_type: string

    @ApiProperty({
        description: 'URL to the document file stored in S3',
        example: 'https://bucket-name.s3.region.amazonaws.com/technicalrecords/uuid-filename.pdf',
        required: false,
    })
    @IsOptional()
    @IsString()
    file_url?: string
} 