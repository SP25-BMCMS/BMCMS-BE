import { $Enums } from '@prisma/client'

export type UserDto = {
    userId: string
    username: string
    password: string
    email: string
    phone: string
    role: $Enums.Role
    dateOfBirth: Date
    gender: $Enums.Gender
}

