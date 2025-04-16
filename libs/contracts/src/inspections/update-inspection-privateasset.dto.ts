import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateInspectionPrivateAssetDto {
  @ApiProperty({
    description: 'Marks if the asset is private or not',
    example: true,
    required: true
  })
  @IsBoolean()
  @IsNotEmpty()
  isprivateasset: boolean;
} 