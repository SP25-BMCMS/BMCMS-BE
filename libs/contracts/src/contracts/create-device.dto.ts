import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeviceType } from '@prisma/client-building';

export class CreateDeviceDto {
    @ApiProperty({
        description: 'The name of the device',
        example: 'HVAC System 101',
        required: true
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'The type of the device',
        enum: DeviceType,
        default: DeviceType.Other,
        required: false
    })
    @IsEnum(DeviceType)
    @IsOptional()
    type?: DeviceType;

    @ApiProperty({
        description: 'The manufacturer of the device',
        example: 'Samsung',
        required: false
    })
    @IsOptional()
    @IsString()
    manufacturer?: string;

    @ApiProperty({
        description: 'The model of the device',
        example: 'LX-2000',
        required: false
    })
    @IsOptional()
    @IsString()
    model?: string;

    @ApiProperty({
        description: 'The building detail ID that this device belongs to',
        example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
        required: true
    })
    @IsString()
    buildingDetailId: string;
} 