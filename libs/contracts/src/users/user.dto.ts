import { $Enums } from '@prisma/client-users'

export type UserDto = {
    userId: string
    username: string
    password: string
    email: string
    phone: string | null
    role: $Enums.Role
<<<<<<< HEAD
    dateOfBirth: Date | null
    gender: $Enums.Gender | null
}
=======
    dateOfBirth: Date
    gender: $Enums.Gender
}
>>>>>>> 32c4253c608e51476c68ac46945cd77b1564d30f
