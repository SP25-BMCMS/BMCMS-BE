import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

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
    description: 'Đánh giá mới cho feedback (1-5)',
    type: Number,
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
} 