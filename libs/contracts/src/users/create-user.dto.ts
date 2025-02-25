import { $Enums, Gender } from '@prisma/client-users';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class createUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
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
}

