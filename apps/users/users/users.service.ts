import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { UserDto } from '../../../libs/contracts/src/users/user.dto';
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';
import { Role } from '@prisma/client-users';
import { CreateWorkingPositionDto } from '../../../libs/contracts/src/users/create-working-position.dto';
import { PositionName } from '@prisma/client-users';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService,
        @Inject('BUILDING_CLIENT') private readonly buildingClient: ClientProxy
    ) { }

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

    async createWorkingPosition(data: CreateWorkingPositionDto) {
        try {
            console.log('Received data:', data); // Debug dữ liệu nhận từ gRPC

            // Kiểm tra xem giá trị có hợp lệ hay không
            if (!Object.values(PositionName).includes(data.positionName as PositionName)) {
                throw new Error(`Invalid positionName: ${data.positionName}`);
            }



            const newPosition = await this.prisma.workingPosition.create({
                data: {
                    positionName: data.positionName as PositionName,  // ✅ Chuyển string thành enum
                    description: data.description,
                }
            });

            return {
                isSuccess: true,
                message: 'Working Position created successfully',
                data: {
                    positionId: newPosition.positionId,
                    positionName: newPosition.positionName.toString(),  // ✅ Chuyển Enum thành chuỗi
                    description: newPosition.description,
                }
            };
        } catch (error) {
            console.error('🔥 Error creating working position:', error);
            throw new RpcException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Failed to create working position'
            });
        }
    }

    async getAllWorkingPositions(): Promise<{
        workingPositions: {
            positionId: string;
            positionName: PositionName;
            description?: string;
        }[]
    }> {
        try {
            const positions = await this.prisma.workingPosition.findMany();
            return {
                workingPositions: positions.map(position => ({
                    positionId: position.positionId,
                    positionName: position.positionName,
                    description: position.description,
                }))
            };
        } catch (error) {
            console.error('Error fetching working positions:', error);
            throw new RpcException({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to fetch working positions'
            });
        }
    }

    async getWorkingPositionById(data: { positionId: string }): Promise<{
        isSuccess: boolean;
        message: string;
        data: {
            positionId: string;
            positionName: PositionName;
            description?: string;
        } | null;
    }> {
        try {
            const position = await this.prisma.workingPosition.findUnique({
                where: { positionId: data.positionId }
            });

            if (!position) {
                throw new RpcException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Working Position not found'
                });
            }

            return {
                isSuccess: true,
                message: 'Working Position retrieved successfully',
                data: {
                    positionId: position.positionId,
                    positionName: position.positionName,
                    description: position.description,
                }
            };
        } catch (error) {
            console.error('Error fetching working position:', error);
            throw new RpcException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Failed to retrieve working position'
            });
        }
    }

    async deleteWorkingPosition(data: { positionId: string }): Promise<{
        isSuccess: boolean;
        message: string;
        data: {
            positionId: string;
            positionName: PositionName;
            description?: string;
        } | null;
    }> {
        try {
            const deletedPosition = await this.prisma.workingPosition.delete({
                where: { positionId: data.positionId }
            });

            return {
                isSuccess: true,
                message: 'Working Position deleted successfully',
                data: {
                    positionId: deletedPosition.positionId,
                    positionName: deletedPosition.positionName,
                    description: deletedPosition.description,
                }
            };
        } catch (error) {
            console.error('Error deleting working position:', error);
            throw new RpcException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Failed to delete working position'
            });
        }
    }

    async createDepartment(data: CreateDepartmentDto) {
        try {
            console.log('📥 Checking if area exists in Building Microservice:', data.area);

            const areaExistsResponse = await firstValueFrom(
                this.buildingClient.send('check_area_exists', { areaName: data.area }).pipe(
                    timeout(5000),
                    catchError((err) => {
                        console.error('❌ Error contacting Building Microservice:', err);
                        throw new RpcException({
                            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                            message: 'Building Microservice is not responding'
                        });
                    })
                )
            );

            if (!areaExistsResponse.exists) {
                console.error(`❌ Area '${data.area}' does not exist in Building Microservice`);
                throw new RpcException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: `Area '${data.area}' does not exist in Building Microservice`
                });
            }

            console.log('✅ Area exists, creating Department...');

            const newDepartment = await this.prisma.department.create({
                data: {
                    departmentName: data.departmentName,
                    description: data.description,
                    area: data.area
                }
            });

            return {
                isSuccess: true,
                message: 'Department created successfully',
                data: {
                    departmentId: newDepartment.departmentId,
                    departmentName: newDepartment.departmentName,
                    description: newDepartment.description,
                    area: newDepartment.area
                }
            };
        } catch (error) {
            console.error('🔥 Error creating department:', error);

            if (error instanceof RpcException) {
                throw error;
            }

            throw new RpcException({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message || 'Unexpected error creating department'
            });
        }
    }

}
