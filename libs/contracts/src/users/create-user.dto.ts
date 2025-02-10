import { $Enums } from "@prisma/client"
import { IsEmail, IsString, MinLength } from "class-validator"

export class createUserDto {
    @IsString()
    username: string

    @IsString()
    @MinLength(6)
    password: string

    @IsEmail()
    email: string

    @IsString()
    phone: string
    
    @IsString()
    role: $Enums.Role

    @IsString()
    dateOfBirth: Date

    @IsString()
    gender: $Enums.Gender
}

