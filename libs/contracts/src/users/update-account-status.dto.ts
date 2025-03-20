import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum AccountStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

export class UpdateAccountStatusDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID to update account status',
    type: String
  })
  userId: string;

  @IsEnum(AccountStatus)
  @IsNotEmpty()
  @ApiProperty({
    description: 'New account status',
    enum: AccountStatus,
    example: "Active|Inactive"
  })
  accountStatus: AccountStatus;
}