import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum AccountStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

export class UpdateAccountStatusDto {
  @IsEnum(AccountStatus)
  @IsNotEmpty()
  @ApiProperty({
    description: 'New account status',
    enum: AccountStatus,
    example: "Active|Inactive"
  })
  accountStatus: AccountStatus;
}