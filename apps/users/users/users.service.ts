import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { UserDto } from '../../../libs/contracts/src/users/user.dto';
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';
import { Role } from '@prisma/client-users';

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

    // async signup(userData: createUserDto): Promise<ApiResponse<any>> {
    //     try {
    //         const existingUser = await this.prisma.user.findFirst({
    //             where: {
    //                 OR: [{ username: userData.username }, { email: userData.email }],
    //             },
    //         });
    //
    //         if (existingUser) {
    //             return new ApiResponse(false, 'Username hoặc Email đã tồn tại', null);
    //         }
    //
    //         const hashedPassword = await bcrypt.hash(userData.password, 10);
    //
    //         let newUser;
    //         if (userData.role === Role.Admin || userData.role === Role.Manager) {
    //             newUser = await this.prisma.user.create({
    //                 data: {
    //                     username: userData.username,
    //                     email: userData.email,
    //                     password: hashedPassword,
    //                     phone: userData.phone,
    //                     role: userData.role,
    //                     dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
    //                     gender: userData.gender ?? null,
    //                 }
    //             });
    //         } else {
    //             newUser = await this.prisma.user.create({
    //                 data: {
    //                     username: userData.username,
    //                     email: userData.email,
    //                     password: hashedPassword,
    //                     phone: userData.phone,
    //                     role: userData.role,
    //                     dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
    //                     gender: userData.gender ?? null,
    //                     userDetails: {
    //                         create: {
    //                             apartmentNumber: userData.role === Role.Resident ? userData.apartmentNumber : null,
    //                             buildingId: userData.role === Role.Resident ? userData.buildingId : null,
    //                             positionId: userData.role === Role.Employee ? userData.positionId : null,
    //                             departmentId: userData.role === Role.Employee ? userData.departmentId : null,
    //                             status: userData.role === Role.Employee ? userData.status : null,
    //                         }
    //                     }
    //                 }
    //             });
    //         }
    //
    //         // ✅ Truy vấn lại user để đảm bảo lấy đủ thông tin
    //         const fullUser = await this.prisma.user.findUnique({
    //             where: { userId: newUser.userId },
    //             include: { userDetails: true } // ✅ Lấy cả UserDetails
    //         });
    //
    //         return new ApiResponse(true, 'User đã được tạo thành công', {
    //             userId: fullUser.userId,
    //             username: fullUser.username,
    //             email: fullUser.email,
    //             phone: fullUser.phone,
    //             role: fullUser.role,
    //             dateOfBirth: fullUser.dateOfBirth ? fullUser.dateOfBirth.toISOString() : null,
    //             gender: fullUser.gender ?? null,
    //             userDetails: fullUser.userDetails ? {
    //                 apartmentNumber: fullUser.userDetails.apartmentNumber,
    //                 buildingId: fullUser.userDetails.buildingId,
    //                 positionId: fullUser.userDetails.positionId,
    //                 departmentId: fullUser.userDetails.departmentId,
    //                 status: fullUser.userDetails.status,
    //             } : null
    //         });
    //
    //     } catch (error) {
    //         console.error('🔥 Lỗi trong UsersService:', error);
    //         return new ApiResponse(false, 'Lỗi không xác định khi tạo user', null);
    //     }
    // }
    async signup(userData: createUserDto): Promise<ApiResponse<any>> {
        try {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [{ username: userData.username }, { email: userData.email }],
                },
            });

            if (existingUser) {
                return new ApiResponse(false, 'Username hoặc Email đã tồn tại', null);
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            let newUser;
            if (userData.role === Role.Admin || userData.role === Role.Manager) {
                newUser = await this.prisma.user.create({
                    data: {
                        username: userData.username,
                        email: userData.email,
                        password: hashedPassword,
                        phone: userData.phone,
                        role: userData.role,
                        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
                        gender: userData.gender ?? null,
                    }
                });
            } else {
                newUser = await this.prisma.user.create({
                    data: {
                        username: userData.username,
                        email: userData.email,
                        password: hashedPassword,
                        phone: userData.phone,
                        role: userData.role,
                        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
                        gender: userData.gender ?? null,
                        userDetails: userData.role === Role.Staff
                          ? {
                              create: {
                                  positionId: userData.positionId ?? null,
                                  departmentId: userData.departmentId ?? null,
                                  staffStatus: userData.staffStatus ?? null,
                                  staffRole: userData.staffRole ?? null,
                              }
                          }
                          : undefined,
                        apartments: userData.role === Role.Resident && userData.apartments
                          ? {
                              create: userData.apartments.map(apartment => ({
                                  apartmentName: apartment.apartmentName,
                                  buildingId: apartment.buildingId,
                              }))
                          }
                          : undefined,
                    }
                });
            }

            // ✅ Truy vấn lại để lấy đầy đủ thông tin
            const fullUser = await this.prisma.user.findUnique({
                where: { userId: newUser.userId },
                include: {
                    apartments: true,
                    userDetails: true
                }
            });

            return new ApiResponse(true, 'User đã được tạo thành công', {
                userId: fullUser?.userId,
                username: fullUser?.username,
                email: fullUser?.email,
                phone: fullUser?.phone,
                role: fullUser?.role,
                dateOfBirth: fullUser?.dateOfBirth ? fullUser.dateOfBirth.toISOString() : null,
                gender: fullUser?.gender ?? null,
                userDetails: fullUser?.userDetails ? {
                    positionId: fullUser?.userDetails.positionId,
                    departmentId: fullUser?.userDetails.departmentId,
                    staffStatus: fullUser?.userDetails.staffStatus,
                    staffRole: fullUser?.userDetails.staffRole,
                } : null,
                apartments: fullUser?.apartments.map(apartment => ({
                    apartmentName: apartment.apartmentName,
                    buildingId: apartment.buildingId
                })) ?? []
            });

        } catch (error) {
            console.error('🔥 Lỗi trong UsersService:', error);
            return new ApiResponse(false, 'Lỗi không xác định khi tạo user', null);
        }
    }


    async updateUser(userId: string, data: Partial<createUserDto>): Promise<UserDto> {
        const user = await this.getUserById(userId)
        if (!user) throw new RpcException({ statusCode: 404, message: 'User not found' })

        return this.prisma.user.update({
            where: { userId },
            data: {
                ...data, // ✅ Giữ lại các trường khác
                apartments: data.apartments
                  ? {
                      set: [], // 🛠 Xóa danh sách cũ (nếu cần)
                      create: data.apartments.map((apt) => ({
                          apartmentName: apt.apartmentName,
                          buildingId: apt.buildingId,
                      })),
                  }
                  : undefined, // ✅ Chỉ cập nhật nếu có apartments
            },
        });
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
