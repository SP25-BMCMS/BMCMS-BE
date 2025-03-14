import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { $Enums } from '@prisma/client-Task';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeTaskStatusDto {
  @ApiProperty({
    description: 'The status of the task',
    type: String,
    example: 'completed',  // Ví dụ về giá trị status
  })
  @IsString()
  @IsNotEmpty()
  status: $Enums.Status;
}