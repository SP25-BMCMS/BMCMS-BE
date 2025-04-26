import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { GuidConverter } from 'libs/shared/src/utils/guid.converter';

export class ChatMessageDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => GuidConverter.toGuid(value))
  userId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Response content' })       
  @IsString()
  response: string;

  @ApiProperty({ description: 'Response type' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'URL of AI detection image' })
  @IsString()
  @IsOptional()
  url_img?: string;
}

export class ChatListQueryDto {
  @ApiProperty({ description: 'User ID', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => GuidConverter.toGuid(value))
  userId?: string;

  @ApiProperty({ description: 'Page number', required: false, type: Number, default: 1 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 1)
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, type: Number, default: 10 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 10)
  limit?: number;
}

export class ResultModel<T = any> {
  @ApiProperty({ description: 'Thành công hay thất bại' })
  @IsNotEmpty()
  success: boolean;

  @ApiPropertyOptional({ description: 'Thông điệp phản hồi' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu trả về' })
  @IsOptional()
  data?: T;

  @ApiPropertyOptional({ description: 'Mã trạng thái HTTP', example: 200 })
  @IsNumber()
  @IsOptional()
  status?: number;
}
