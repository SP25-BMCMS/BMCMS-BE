import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { USERS_CLIENT } from '../../constraints';
import { UserInterface } from '../user/users.interface';

@Injectable()
export class DepartmentService implements OnModuleInit {
    private userService: UserInterface;

    constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) { }

    onModuleInit() {
        this.userService = this.client.getService<UserInterface>('UserService');
    }

    async getAllDepartments() {
        try {
            const response = await firstValueFrom(
                this.userService.getAllDepartments({}).pipe(
                    catchError((error) => {
                        console.error('Error fetching departments:', error);
                        return throwError(
                            () =>
                                new HttpException(
                                    error.details || 'Lỗi khi lấy danh sách phòng ban',
                                    HttpStatus.INTERNAL_SERVER_ERROR,
                                ),
                        );
                    }),
                ),
            );

            return response;
        } catch (error) {
            throw new HttpException(
                error.message || 'Lỗi khi lấy danh sách phòng ban',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
} 