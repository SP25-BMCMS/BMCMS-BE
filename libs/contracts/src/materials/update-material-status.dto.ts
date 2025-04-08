import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MaterialStatus } from '@prisma/client-Task';

export class UpdateMaterialStatusDto {
    @IsEnum(MaterialStatus)
    @ApiProperty({ 
        description: 'New status of the material',
        enum: MaterialStatus,
        example: MaterialStatus.ACTIVE
    })
    status: MaterialStatus;
} 