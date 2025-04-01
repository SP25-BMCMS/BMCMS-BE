import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { FeedbackStatus } from '@prisma/client-Task';
/**
 * Enum liệt kê các trạng thái có thể có của feedback
 */

/**
 * DTO để cập nhật trạng thái của feedback
 */
export class UpdateFeedbackStatusDto {
  @ApiProperty({
    description: 'ID của feedback cần thay đổi trạng thái',
    example: 'd1b0cd4c-1e76-4d7f-a0d4-81b32e5101cd',
  })
  @IsNotEmpty()
  @IsUUID()
  feedback_id: string;

  @ApiProperty({
    description: 'Trạng thái mới của feedback',
    enum: FeedbackStatus,
    example: FeedbackStatus.ACTIVE  + FeedbackStatus.DELETED,
  })
  @IsNotEmpty()
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
} 