import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
    @ApiProperty({
        description: 'Tên phòng ban',
        example: 'Phòng Nhân sự',
      })
      @IsNotEmpty()
      @IsString()
      departmentName: string;
    
      @ApiPropertyOptional({
        description: 'Mô tả phòng ban (không bắt buộc)',
        example: 'Chịu trách nhiệm về tuyển dụng và phúc lợi',
      })
      @IsOptional()
      @IsString()
      description?: string;
    
      @ApiProperty({
        description: 'Khu vực hoạt động',
        example: 'Hà Nội',
      })
      @IsNotEmpty()
      @IsString()
      area: string;
}
