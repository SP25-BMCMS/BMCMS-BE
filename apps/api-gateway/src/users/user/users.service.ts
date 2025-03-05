import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { catchError, firstValueFrom, lastValueFrom, throwError } from 'rxjs';
import { USERS_CLIENT } from '../../constraints'
import { UserInterface } from './users.interface'
import { createUserDto } from 'libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../../../libs/contracts/src/ApiReponse/api-response';

@Injectable()
export class UsersService implements OnModuleInit {
  private userService: UserInterface

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) { }

  onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService')
  }

  async login(data: { username: string, password: string }) {
    return await lastValueFrom(this.userService.login(data))
  }

  async signup(userData: createUserDto): Promise<ApiResponse<any>> {
    try {
      const response = await firstValueFrom(
        this.userService.signup(userData).pipe(
          catchError((error) => {
            return throwError(() => new HttpException(error.details || 'Lỗi gRPC không xác định', HttpStatus.BAD_REQUEST));
          })
        )
      );

      return new ApiResponse(response.isSuccess, response.message, response.data);
    } catch (error) {
      return new ApiResponse(false, error.message || 'Lỗi khi tạo user', null);
    }
  }


  async logout() {
    return await lastValueFrom(this.userService.logout({}))
  }

  async getUserInfo(data: { userId: string, username: string }) {
    return await lastValueFrom(this.userService.getUserInfo(data))
  }

  async getAllUsers() {
    return await firstValueFrom(this.userService.getAllUsers({}))
  }


  async test(data: { username: string; password: string }) {
    return await lastValueFrom(this.userService.test(data))
  }

}
