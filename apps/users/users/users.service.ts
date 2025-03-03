
import { status } from '@grpc/grpc-js'
import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { Gender, Role } from '@prisma/client-users'
import * as bcrypt from 'bcrypt'
import { PrismaService  } from '../prisma/prisma.service'
import { UserDto } from '../../../libs/contracts/src/users/user.dto';
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getUserByUsername(username: string): Promise<UserDto | null> {

        const user = await this.prisma.user.findUnique({ where: { username } })
        if (!user) throw new RpcException({ statusCode: 401, message: 'invalid credentials!' })
        return user
    }

    async getUserById(userId: string): Promise<UserDto | null> {
        const user = await this.prisma.user.findUnique({ where: { userId } })
        if (!user)
            throw new RpcException({ statusCode: 401, message: 'invalid credentials!' })
        return user
    }

    async createUser(data: createUserDto) {
        try {
            // ✅ Kiểm tra dữ liệu đầu vào
            if (!data.username || !data.email || !data.password || !data.role) {
                throw new RpcException({
                    code: status.INVALID_ARGUMENT,
                    message: 'Missing required fields (username, email, password, role)',
                })
            }

            // ✅ Kiểm tra role có hợp lệ không
            if (!Object.values(Role).includes(data.role)) {
                throw new RpcException({
                    code: status.INVALID_ARGUMENT,
                    message: `Invalid role. Allowed roles: ${Object.values(Role).join(', ')}`,
                })
            }

            // ✅ Kiểm tra user có tồn tại chưa
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [{ username: data.username }, { email: data.email }],
                },
            })

            if (existingUser) {
                throw new RpcException({
                    code: status.ALREADY_EXISTS, 
                    message: 'Username or email already exists',
                })
            }

            // ✅ Hash mật khẩu
            const hashedPassword = await bcrypt.hash(data.password, 10)

            // ✅ Tạo user
            const newUser = await this.prisma.user.create({
                data: {
                    username: data.username,
                    email: data.email,
                    password: hashedPassword,
                    phone: data.phone || null,
                    role: data.role as Role,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    gender: data.gender as Gender,
                },
            })

            return {
                userId: newUser.userId,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                dateOfBirth: newUser.dateOfBirth,
                gender: newUser.gender,
            }
        } catch (error) {
            console.error('🔥 Error creating user:', error)

            if (error instanceof RpcException) {
                throw error
            }

            throw new RpcException({
                code: 500,
                message: error.message || 'Internal server error',
            })
        }
    }


    async updateUser(userId: string, data: Partial<createUserDto>): Promise<UserDto> {
        const user = await this.getUserById(userId)
        if (!user) throw new RpcException({ statusCode: 404, message: 'User not found' })

        return this.prisma.user.update({
            where: { userId },
            data,
        })
    }

    async deleteUser(userId: string): Promise<{ message: string }> {
        await this.prisma.user.delete({ where: { userId } })
        return { message: 'User deleted successfully' }
    }

    async getAllUsers()
        : Promise<{ users: UserDto[] }> {
        const users = await this.prisma.user.findMany()
        return { users: users }
    }
}
