import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { PositionName } from '@prisma/client-users';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkingPositionDto {
    @IsNotEmpty()
    @IsEnum(PositionName, {
      message: `positionName must be one of: ${Object.values(PositionName).join(', ')}`, // Custom error message
    })
    @ApiProperty({
      description: 'The position name (must be one of the defined position names).',
      enum: PositionName,
      example: 'Manager',
    })
    positionName: PositionName; // Required position name, validated as an enum
  
    @IsOptional()
    @IsString()
    @ApiProperty({
      description: 'A description of the position (optional).',
      example: 'Responsible for overseeing financial operations.',
      required: false,
    })
    description?: string; // Optional description of the position

}
