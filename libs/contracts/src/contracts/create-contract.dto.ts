import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDeviceDto } from './create-device.dto';

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

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'PDF contract file (maximum 10MB)',
        required: true
    })
    contractFile: Express.Multer.File;

    @ApiProperty({
        description: 'Devices to be associated with this contract. Can be a single device object or an array of devices.',
        type: [CreateDeviceDto],
        required: false,
        example: [{
            name: 'Air Conditioner',
            type: 'HVAC',
            manufacturer: 'Samsung',
            model: 'AC-2000',
            buildingDetailId: '550e8400-e29b-41d4-a716-446655440000'
        }]
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateDeviceDto)
    devices?: CreateDeviceDto[] | CreateDeviceDto | string;
} 