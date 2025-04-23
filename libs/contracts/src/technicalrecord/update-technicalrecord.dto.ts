import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, Allow } from 'class-validator'

export class UpdateTechnicalRecordDto {
    @ApiProperty({
        description: 'The ID of the device this technical record belongs to',
        example: 'b3a2c1d0-e9f8-4a6b-8c7d-1e2f3a4b5c6d',
        required: false,
    })
    @IsOptional()
    @IsString()
    device_id?: string

    @ApiProperty({
        description: 'The name of the file',
        example: 'maintenance_manual.pdf',
        required: false,
    })
    @IsOptional()
    @IsString()
    file_name?: string

    @ApiProperty({
        description: 'The type of the technical document',
        example: 'manual',
        required: false,
    })
    @IsOptional()
    @IsString()
    file_type?: string

    @ApiProperty({
        description: 'URL to the document file stored in S3',
        example: 'https://bucket-name.s3.region.amazonaws.com/technicalrecords/uuid-filename.pdf',
        required: false,
    })
    @IsOptional()
    @IsString()
    file_url?: string

    // This property is used only for file uploads and should be excluded from validation
    @IsOptional()
    @Allow()
    recordFile?: any
} 