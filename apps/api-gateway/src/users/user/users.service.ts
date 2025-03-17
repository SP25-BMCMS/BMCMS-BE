import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { catchError, firstValueFrom, lastValueFrom, throwError } from 'rxjs';
import { USERS_CLIENT } from '../../constraints'
import { UserInterface } from './users.interface'
import { createUserDto } from 'libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../../../libs/contracts/src/ApiReponse/api-response';
import { CreateWorkingPositionDto } from 'libs/contracts/src/users/create-working-position.dto';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';

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

  // Working Position Methods
  async createWorkingPosition(data: CreateWorkingPositionDto) {
    return await lastValueFrom(
      this.userService.createWorkingPosition(data).pipe(
        catchError((error) => {
          return throwError(() => new HttpException(error.details || 'Lỗi gRPC không xác định', HttpStatus.BAD_REQUEST));
        })
      )
    );
  }

  async getAllWorkingPositions() {
    return await firstValueFrom(this.userService.getAllWorkingPositions({}));
  }

  async getWorkingPositionById(positionId: string) {
    return await lastValueFrom(this.userService.getWorkingPositionById({ positionId }));
  }


  async deleteWorkingPosition(positionId: string) {
    return await lastValueFrom(this.userService.deleteWorkingPosition({ positionId }));
  }

  async createDepartment(data: CreateDepartmentDto) {
    try {
      // Add timeout and retry mechanism
      const response = await firstValueFrom(
        this.userService.createDepartment(data).pipe(
          catchError((error) => {
            console.error('Department Creation Error:', error);

            // Specific error handling
            if (error.code === 14) { // Connection error
              return throwError(() => new HttpException(
                'Dịch vụ không khả dụng. Vui lòng thử lại sau.',
                HttpStatus.SERVICE_UNAVAILABLE
              ));
            }

            return throwError(() => new HttpException(
              error.details || 'Lỗi không xác định khi tạo phòng ban',
              HttpStatus.INTERNAL_SERVER_ERROR
            ));
          })
        ),
        { defaultValue: null } // Prevent unhandled promise rejection
      );

      // Handle null response
      if (!response) {
        return new ApiResponse(
          false,
          'Không thể kết nối đến dịch vụ. Vui lòng kiểm tra kết nối.',
          null
        );
      }

      return new ApiResponse(
        response.isSuccess,
        response.message || 'Thao tác thành công',
        response.data
      );
    } catch (error) {
      console.error('Unexpected error in createDepartment:', error);

      // Log the full error for debugging
      return new ApiResponse(
        false,
        error.message || 'Lỗi hệ thống không xác định',
        null
      );
    }
  }

  async getApartmentsByResidentId(residentId: string): Promise<{ isSuccess: boolean; message: string; data: { apartmentName: string; buildingId: string }[] }> {
    try {
      const response = await lastValueFrom(this.userService.getApartmentsByResidentId({ residentId }));

      if (!response || typeof response !== 'object' || !('isSuccess' in response)) {
        return { isSuccess: false, message: 'Invalid response from user service', data: [] };
      }

      return response;
    } catch (error) {
      return { isSuccess: false, message: 'Service unavailable', data: [] };
    }
  }

}
