import { $Enums, Gender } from '@prisma/client-users';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class createUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEnum($Enums.Role)
    @IsNotEmpty()
    role: $Enums.Role;

    @IsDateString()
    @IsOptional()
    dateOfBirth?: string;

    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    // 🔥 Nếu là Resident, có thể tạo nhiều Apartment
    @IsOptional()
    apartments?: { apartmentName: string; buildingId: string }[];

    // ✅ Nếu là Staff, thêm các thông tin này
    @IsString()
    @IsOptional()
    positionId?: string;

    @IsString()
    @IsOptional()
    departmentId?: string;

    @IsEnum($Enums.StaffStatus)
    @IsOptional()
    staffStatus?: $Enums.StaffStatus;

    @IsEnum($Enums.StaffRole)
    @IsOptional()
    staffRole?: $Enums.StaffRole; // ✅ Thêm Staff Role
}
