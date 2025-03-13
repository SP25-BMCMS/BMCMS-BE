import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { PositionName, PositionStatus } from '@prisma/client-users';

export class CreateWorkingPositionDto {
    @IsNotEmpty()
    @IsEnum(PositionName, { message: `positionName must be one of: ${Object.values(PositionName).join(', ')}` })  // ✅ Kiểm tra Enum
    positionName: PositionName;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsEnum(PositionStatus, { message: `status must be one of: ${Object.values(PositionStatus).join(', ')}` })  // ✅ Kiểm tra Enum
    status: PositionStatus;
}
