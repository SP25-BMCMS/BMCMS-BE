import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class UpdateFeedbackDto {
  @ApiProperty({
    description: 'The unique identifier of the feedback',
    example: '5ec2f597-45d0-40f9-b281-ad602e5296b6',
  })
  @IsUUID()
  @IsNotEmpty()
  feedback_id: string;

  @ApiProperty({
    description: 'Updated comments or feedback text',
    type: String,
    example: 'The work was excellent and completed ahead of schedule.',
    required: false,
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({
    description: 'Updated rating for the task (1-5)',
    type: Number,
    minimum: 1,
    maximum: 5,
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
} 