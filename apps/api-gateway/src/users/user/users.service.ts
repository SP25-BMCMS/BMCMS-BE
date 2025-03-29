import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { catchError, firstValueFrom, lastValueFrom, throwError } from 'rxjs';
import { USERS_CLIENT } from '../../constraints';
import { UserInterface } from './users.interface';
import { createUserDto } from 'libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../../../libs/contracts/src/ApiReponse/api-response';
import { CreateWorkingPositionDto } from 'libs/contracts/src/users/create-working-position.dto';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';
import { LoginDto } from 'libs/contracts/src/users/login.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private userService: UserInterface;

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService');
  }

  async login(data: { username: string; password: string }) {
    return await lastValueFrom(this.userService.login(data));
  }

  async signup(userData: createUserDto): Promise<ApiResponse<any>> {
    try {
      const response = await firstValueFrom(
        this.userService.signup(userData).pipe(
          catchError((error) => {
            return throwError(
              () =>
                new HttpException(
                  error.details || 'Lỗi gRPC không xác định',
                  HttpStatus.BAD_REQUEST,
                ),
            );
          }),
        ),
      );

      return new ApiResponse(
        response.isSuccess,
        response.message,
        response.data,
      );
    } catch (error) {
      return new ApiResponse(false, error.message || 'Lỗi khi tạo user', null);
    }
  }

  async verifyOtpAndCompleteSignup(data: {
    email: string;
    otp: string;
    userData: createUserDto;
  }) {
    try {
      console.log('Verifying OTP in API Gateway:', data);
      const response = await lastValueFrom(
        this.userService.verifyOtpAndCompleteSignup(data).pipe(
          catchError((error) => {
            console.error('OTP verification error in API Gateway:', error);
            let errorMessage = 'Mã OTP không hợp lệ';
            let statusCode = HttpStatus.BAD_REQUEST;

            if (error && error.details) {
              errorMessage = error.details;
            }

            return throwError(
              () => new HttpException(errorMessage, statusCode),
            );
          }),
        ),
      );

      console.log('OTP verification response:', response);
      return response;
    } catch (error) {
      console.error('Error in verifyOtpAndCompleteSignup:', error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Xác thực OTP thất bại', HttpStatus.BAD_REQUEST);
    }
  }

  async logout() {
    return await lastValueFrom(this.userService.logout({}));
  }

  async getUserInfo(data: { userId: string; username: string }) {
    return await lastValueFrom(this.userService.getUserInfo(data));
  }

  async getAllUsers() {
    return await firstValueFrom(this.userService.getAllUsers({}));
  }

  async test(data: { username: string; password: string }) {
    return await lastValueFrom(this.userService.test(data));
  }

  // Working Position Methods
  async createWorkingPosition(data: CreateWorkingPositionDto) {
    return await lastValueFrom(
      this.userService.createWorkingPosition(data).pipe(
        catchError((error) => {
          return throwError(
            () =>
              new HttpException(
                error.details || 'Lỗi gRPC không xác định',
                HttpStatus.BAD_REQUEST,
              ),
          );
        }),
      ),
    );
  }

  async getAllWorkingPositions() {
    return await firstValueFrom(this.userService.getAllWorkingPositions({}));
  }

  async getWorkingPositionById(positionId: string) {
    return await lastValueFrom(
      this.userService.getWorkingPositionById({ positionId }),
    );
  }

  async deleteWorkingPosition(positionId: string) {
    return await lastValueFrom(
      this.userService.deleteWorkingPosition({ positionId }),
    );
  }

  async createDepartment(data: CreateDepartmentDto) {
    try {
      // Add timeout and retry mechanism
      const response = await firstValueFrom(
        this.userService.createDepartment(data).pipe(
          catchError((error) => {
            console.error('Department Creation Error:', error);

            // Specific error handling
            if (error.code === 14) {
              // Connection error
              return throwError(
                () =>
                  new HttpException(
                    'Dịch vụ không khả dụng. Vui lòng thử lại sau.',
                    HttpStatus.SERVICE_UNAVAILABLE,
                  ),
              );
            }

            return throwError(
              () =>
                new HttpException(
                  error.details || 'Lỗi không xác định khi tạo phòng ban',
                  HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            );
          }),
        ),
        { defaultValue: null }, // Prevent unhandled promise rejection
      );

      // Handle null response
      if (!response) {
        return new ApiResponse(
          false,
          'Không thể kết nối đến dịch vụ. Vui lòng kiểm tra kết nối.',
          null,
        );
      }

      return new ApiResponse(
        response.isSuccess,
        response.message || 'Thao tác thành công',
        response.data,
      );
    } catch (error) {
      console.error('Unexpected error in createDepartment:', error);

      // Log the full error for debugging
      return new ApiResponse(
        false,
        error.message || 'Lỗi hệ thống không xác định',
        null,
      );
    }
  }

  async getApartmentsByResidentId(
    residentId: string,
  ): Promise<{
    isSuccess: boolean;
    message: string;
    data: { apartmentName: string; buildingId: string }[];
  }> {
    try {
      const response = await lastValueFrom(
        this.userService.getApartmentsByResidentId({ residentId }),
      );

      if (
        !response ||
        typeof response !== 'object' ||
        !('isSuccess' in response)
      ) {
        return {
          isSuccess: false,
          message: 'Invalid response from user service',
          data: [],
        };
      }

      return response;
    } catch (error) {
      return { isSuccess: false, message: 'Service unavailable', data: [] };
    }
  }

  async residentLogin(data: { phone: string; password: string }) {
    try {
      const response = await lastValueFrom(
        this.userService.residentLogin(data).pipe(
          catchError((error) => {
            console.error('Resident login error:', error);

            let errorMessage = 'Sai số điện thoại hoặc mật khẩu';
            let statusCode = HttpStatus.UNAUTHORIZED;

            if (error && error.details) {
              if (error.details.includes('Tài khoản chưa được kích hoạt')) {
                errorMessage =
                  'Tài khoản chưa được kích hoạt, vui lòng liên hệ ban quản lý để được kích hoạt';
                statusCode = HttpStatus.UNAUTHORIZED;
              } else if (
                error.details.includes('Sai số điện thoại hoặc mật khẩu')
              ) {
                errorMessage = 'Sai số điện thoại hoặc mật khẩu';
                statusCode = HttpStatus.UNAUTHORIZED;
              } else {
                errorMessage = error.details;
              }
            }

            throw new HttpException(errorMessage, statusCode);
          }),
        ),
      );

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Đăng nhập không thành công',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async verifyOtpAndLogin(data: { phone: string; otp: string }) {
    try {
      const response = await lastValueFrom(
        this.userService.verifyOtpAndLogin(data).pipe(
          catchError((error) => {
            console.error('OTP verification error:', error);

            let errorMessage = 'Mã OTP không hợp lệ';
            let statusCode = HttpStatus.UNAUTHORIZED;

            if (error && error.details) {
              errorMessage = error.details;
            }

            throw new HttpException(errorMessage, statusCode);
          }),
        ),
      );

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Xác thực OTP thất bại', HttpStatus.UNAUTHORIZED);
    }
  }

  async updateResidentApartments(
    residentId: string,
    apartments: { apartmentName: string; buildingId: string }[],
  ) {
    try {
      const response = await lastValueFrom(
        this.userService
          .updateResidentApartments({ residentId, apartments })
          .pipe(
            catchError((error) => {
              console.error('Update resident apartments error:', error);

              // Kiểm tra nếu error có details
              if (error.details) {
                // Kiểm tra message để xác định loại lỗi
                if (error.details.includes('Cư dân đã sở hữu')) {
                  return throwError(
                    () =>
                      new HttpException(error.details, HttpStatus.BAD_REQUEST),
                  );
                } else if (error.details.includes('Không tìm thấy tòa nhà')) {
                  return throwError(
                    () =>
                      new HttpException(error.details, HttpStatus.NOT_FOUND),
                  );
                } else if (
                  error.details.includes('Dịch vụ tòa nhà không khả dụng')
                ) {
                  return throwError(
                    () =>
                      new HttpException(
                        error.details,
                        HttpStatus.SERVICE_UNAVAILABLE,
                      ),
                  );
                }
              }

              // Nếu không có details hoặc không match với các trường hợp trên, trả về 500
              return throwError(
                () =>
                  new HttpException(
                    'Lỗi khi thêm căn hộ',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                  ),
              );
            }),
          ),
      );
      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Lỗi khi thêm căn hộ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateAccountStatus(userId: string, accountStatus: string) {
    try {
      const response = await lastValueFrom(
        this.userService.updateAccountStatus({ userId, accountStatus }).pipe(
          catchError((error) => {
            console.error('Update account status error:', error);

            if (error.details) {
              if (error.details.includes('không tìm thấy')) {
                return throwError(
                  () => new HttpException(error.details, HttpStatus.NOT_FOUND),
                );
              }
            }

            return throwError(
              () =>
                new HttpException(
                  error.details || 'Lỗi khi cập nhật trạng thái tài khoản',
                  HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            );
          }),
        ),
      );

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Lỗi hệ thống khi cập nhật trạng thái tài khoản',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async residentSignup(data: createUserDto) {
    try {
      // Set role to Resident
      data.role = 'Resident';
      const response = await firstValueFrom(
        this.userService.signup(data).pipe(
          catchError((error) => {
            return throwError(
              () =>
                new HttpException(
                  error.details || 'Lỗi gRPC không xác định',
                  HttpStatus.BAD_REQUEST,
                ),
            );
          }),
        ),
      );
      return response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async staffSignup(data: createUserDto) {
    try {
      const response = await firstValueFrom(
        this.userService.signup(data).pipe(
          catchError((error) => {
            return throwError(
              () =>
                new HttpException(
                  error.details || 'Lỗi gRPC không xác định',
                  HttpStatus.BAD_REQUEST,
                ),
            );
          }),
        ),
      );
      return response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
