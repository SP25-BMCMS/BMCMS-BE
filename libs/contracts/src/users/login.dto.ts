import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The username for login',
    type: String,
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'The password for login',
    type: String,
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
