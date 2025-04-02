import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'The ID of the task associated with the feedback',
    type: String,
    example: 'd1b0cd4c-1e76-4d7f-a0d4-81b32e5101cd',
  })
  @IsNotEmpty()
  @IsUUID()
  task_id: string;

  @ApiProperty({
    description: 'The ID of the user providing the feedback',
    type: String,
    example: 'e2b0cd4c-1e76-4d7f-a0d4-91b32e5101cd',
  })
  @IsNotEmpty()
  @IsString()
  feedback_by: string;

  @ApiProperty({
    description: 'Comments or feedback text',
    type: String,
    example: 'The work was done well and on time.',
  })
  @IsNotEmpty()
  @IsString()
  comments: string;

  @ApiProperty({
    description: 'Rating for the task (1-5)',
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