
import { status } from '@grpc/grpc-js'
import { BadRequestException, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices'
import { EmploymentStatus, Gender, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { UserDto } from '../../../libs/contracts/src/users/user.dto';
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';

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

    async createUser(data: createUserDto): Promise<ApiResponse<any>> {
        try {
            // 🔹 1. Kiểm tra dữ liệu đầu vào
            if (!data.username || !data.email || !data.password || !data.role) {
                throw new BadRequestException(new ApiResponse(false, 'Missing required fields (username, email, password, role)'));
            }

            if (!Object.values(Role).includes(data.role)) {
                throw new BadRequestException(new ApiResponse(false, `Invalid role. Allowed roles: ${Object.values(Role).join(', ')}`));
            }

            // 🔹 2. Kiểm tra user đã tồn tại chưa
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [{ username: data.username }, { email: data.email }],
                },
            });

            if (existingUser) {
                throw new BadRequestException(new ApiResponse(false, 'Username or email already exists'));
            }

            // 🔹 3. Hash mật khẩu trước khi lưu vào DB
            const hashedPassword = await bcrypt.hash(data.password, 10);

            // 🔹 4. Sử dụng transaction để đảm bảo dữ liệu đồng bộ
            const result = await this.prisma.$transaction(async (prisma) => {
                // 🔹 4.1 Tạo User trước
                const newUser = await prisma.user.create({
                    data: {
                        username: data.username,
                        email: data.email,
                        password: hashedPassword,
                        phone: data.phone || null,
                        role: data.role as Role,
                        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                        gender: data.gender as Gender,
                    },
                });

                let userDetailsData = null;

                // 🔹 4.2 Nếu là Resident hoặc Employee, tạo thêm UserDetails
                if (data.role === Role.Resident || data.role === Role.Employee) {
                    userDetailsData = await prisma.userDetails.create({
                        data: {
                            userId: newUser.userId,
                            apartmentNumber: data.role === Role.Resident ? 'UNKNOWN' : null,
                            buildingId: data.role === Role.Resident ? 'UNKNOWN' : null,
                            positionId: data.role === Role.Employee ? 'UNKNOWN' : null,
                            departmentId: data.role === Role.Employee ? 'UNKNOWN' : null,
                            status: data.role === Role.Employee ? EmploymentStatus.Probation : null,
                        },
                    });
                }

                return { user: newUser, userDetails: userDetailsData };
            });

            // 🔹 5. Trả về API Response chuẩn
            return new ApiResponse(
              true,
              'User created successfully',
              [result] // Dữ liệu bao gồm user và userDetails (nếu có)
            );
        } catch (error) {
            console.error('🔥 Error creating user:', error);
            throw new BadRequestException(new ApiResponse(false, error.message || 'Internal server error'));
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
