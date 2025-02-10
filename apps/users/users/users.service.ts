import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { createUserDto } from '@app/contracts/users/create-user.dto'
import { UserDto } from '@app/contracts/users/user.dto'
import * as bcrypt from 'bcrypt'
import { RpcException } from '@nestjs/microservices'

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getUserByUsername(username: string): Promise<UserDto | null> {
        const user = await this.prisma.user.findUnique({ where: { username } })
        if (!user) throw new NotFoundException(`User with username ${username} not found`)
        return user
    }

    async getUserById(userId: string): Promise<UserDto | null> {
        const user = await this.prisma.user.findUnique({ where: { userId } })
        if (!user) throw new NotFoundException(`User with ID ${userId} not found`)
        return user
    }

    async createUser(data: createUserDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ username: data.username }, { email: data.email }] },
        });

        if (existingUser) {
            throw new RpcException({
                statusCode: 409,
                message: 'Username or email already exists',
            });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const newUser = await this.prisma.user.create({
            data: { ...data, password: hashedPassword },
        });

        return newUser;
    }

    async getAllUsers(): Promise<UserDto[]> {
        return this.prisma.user.findMany()
    }
}
