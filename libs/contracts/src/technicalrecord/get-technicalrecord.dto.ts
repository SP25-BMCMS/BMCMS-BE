import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator'

export class GetTechnicalRecordDto {
    @ApiProperty({
        description: 'The unique ID of the technical record',
        example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    id?: string

    @ApiProperty({
        description: 'The ID of the building to filter technical records by',
        example: 'b3a2c1d0-e9f8-4a6b-8c7d-1e2f3a4b5c6d',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    building_id?: string

    @ApiProperty({
        description: 'Title of the technical record',
        example: 'Fire Safety Inspection Report',
    })
    @IsString()
    title: string

    @ApiProperty({
        description: 'Document type (e.g., inspection, certification, report)',
        example: 'inspection',
    })
    @IsString()
    document_type: string

    @ApiProperty({
        description: 'Date the document was issued or created',
        example: '2023-07-15',
    })
    @IsDateString()
    issue_date: string

    @ApiProperty({
        description: 'Date when the document expires (if applicable)',
        example: '2024-07-15',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    expiry_date?: string

    @ApiProperty({
        description: 'URL to the document file stored in S3',
        example: 'https://bucket-name.s3.region.amazonaws.com/technicalrecords/uuid-filename.pdf',
        required: false,
    })
    @IsOptional()
    @IsString()
    document_url?: string

    @ApiProperty({
        description: 'Additional notes or description about the technical record',
        example: 'Annual fire safety inspection with all systems passing compliance checks',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string

    @ApiProperty({
        description: 'Date when the record was created',
        example: '2023-07-15T10:30:00Z',
    })
    @IsDateString()
    createdAt: string

    @ApiProperty({
        description: 'Date when the record was last updated',
        example: '2023-07-15T10:30:00Z',
    })
    @IsDateString()
    updatedAt: string
} 