import { $Enums } from '@prisma/client-users'

export type UserDto = {
    userId: string
    username: string
    password: string
    email: string
    phone: string | null
    role: $Enums.Role
    dateOfBirth: Date | null
    gender: $Enums.Gender | null
}