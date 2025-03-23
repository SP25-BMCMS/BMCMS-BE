import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { PositionName } from '@prisma/client-users';

export class CreateWorkingPositionDto {
    @IsNotEmpty()
    @IsEnum(PositionName, { message: `positionName must be one of: ${Object.values(PositionName).join(', ')}` })  // ✅ Kiểm tra Enum
    positionName: PositionName;

    @IsOptional()
    @IsString()
    description?: string;


}
