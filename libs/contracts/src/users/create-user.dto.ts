import { ApiProperty } from '@nestjs/swagger';
import { $Enums, Gender } from '@prisma/client-users';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class createUserDto {
    // @IsString()
    // @IsNotEmpty()
    // username: string;

    // @IsEmail()
    // @IsNotEmpty()
    // email: string;

    // @IsString()
    // @IsNotEmpty()
    // password: string;

    // @IsString()
    // @IsOptional()
    // phone?: string;

    // @IsEnum($Enums.Role)
    // @IsNotEmpty()
    // role: $Enums.Role;

    // @IsDateString()
    // @IsOptional()
    // dateOfBirth?: string;

    // @IsEnum(Gender)
    // @IsOptional()
    // gender?: Gender;

    // // 🔥 Nếu là Resident, có thể tạo nhiều Apartment
    // @IsOptional()
    // apartments?: { apartmentName: string; buildingId: string }[];

    // // ✅ Nếu là Staff, thêm các thông tin này
    // @IsString()
    // @IsOptional()
    // positionId?: string;

    // @IsString()
    // @IsOptional()
    // departmentId?: string;

    // @IsEnum($Enums.StaffStatus)
    // @IsOptional()
    // staffStatus?: $Enums.StaffStatus;

    // @IsEnum($Enums.StaffRole)
    // @IsOptional()
    // staffRole?: $Enums.StaffRole; // ✅ Thêm Staff Role
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Username of the user', type: String })
    username: string;

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({ description: 'Email address of the user', type: String })
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Password for the user', type: String })
    password: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Phone number of the user', required: false, type: String })
    phone?: string;

    @IsEnum($Enums.Role)
    @IsNotEmpty()
    @ApiProperty({
        description: 'Role of the user (e.g., Admin, User)', enum: $Enums.Role,
        example: "Admin|Manager|Resident|Staff"

    })
    role: $Enums.Role;

    @IsDateString()
    @IsOptional()
    @ApiProperty({ description: 'Date of birth of the user', required: false, type: String })
    dateOfBirth?: string;

    @IsEnum(Gender)
    @IsOptional()
    @ApiProperty({ description: 'Gender of the user', required: false, enum: Gender, example: "Male|Female|Other" })
    gender?: Gender;

    // 🔥 If Resident, can create multiple apartments
    @IsOptional()
    @ApiProperty()
    apartments?: { apartmentName: string; buildingDetailId: string }[];

    // ✅ If Staff, add these fields
    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Position ID of the staff (only applicable if user is a Staff)', required: false, type: String })
    positionId?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Department ID of the staff (only applicable if user is a Staff)', required: false, type: String })
    departmentId?: string;

    @IsEnum($Enums.StaffStatus)
    @IsOptional()
    @ApiProperty({ description: 'Status of the staff (e.g., Active, Inactive)', required: false, enum: $Enums.StaffStatus, example: "Active|Inactive| Probation" })
    staffStatus?: $Enums.StaffStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Image of the user', required: false, type: String })
    image?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Account status (Active/Inactive). Defaults to Active for staff/admin, Inactive for residents',
        required: false,
        type: String,
        example: "Active|Inactive"
    })
    accountStatus?: string;
}
