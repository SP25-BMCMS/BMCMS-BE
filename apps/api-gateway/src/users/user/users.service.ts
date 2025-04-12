import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { catchError, firstValueFrom, lastValueFrom, throwError } from 'rxjs'
import { USERS_CLIENT } from '../../constraints'
import { UserInterface } from './users.interface'
import { createUserDto } from 'libs/contracts/src/users/create-user.dto'
import { ApiResponse } from '../../../../../libs/contracts/src/ApiResponse/api-response'
import { CreateWorkingPositionDto } from 'libs/contracts/src/users/create-working-position.dto'
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto'
import { LoginDto } from 'libs/contracts/src/users/login.dto'

@Injectable()
export class UsersService implements OnModuleInit {
  private userService: UserInterface

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) { }

  onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService')
  }

  async login(data: { username: string; password: string }) {
    return await lastValueFrom(this.userService.login(data))
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
            )
          }),
        ),
      )

      return new ApiResponse(
        response.isSuccess,
        response.message,
        response.data,
      )
    } catch (error) {
      return new ApiResponse(false, error.message || 'Lỗi khi tạo user', null)
    }
  }

  async verifyOtpAndCompleteSignup(data: {
    email: string
    otp: string
    userData: createUserDto
  }) {
    try {
      console.log('Verifying OTP in API Gateway:', data)
      const response = await lastValueFrom(
        this.userService.verifyOtpAndCompleteSignup(data).pipe(
          catchError((error) => {
            console.error('OTP verification error in API Gateway:', error)
            let errorMessage = 'Mã OTP không hợp lệ'
            let statusCode = HttpStatus.BAD_REQUEST

            if (error && error.details) {
              errorMessage = error.details
            }

            return throwError(
              () => new HttpException(errorMessage, statusCode),
            )
          }),
        ),
      )

      console.log('OTP verification response:', response)
      return response
    } catch (error) {
      console.error('Error in verifyOtpAndCompleteSignup:', error)
      if (error instanceof HttpException) {
        throw error
      }

      throw new HttpException('Xác thực OTP thất bại', HttpStatus.BAD_REQUEST)
    }
  }

  async logout() {
    return await lastValueFrom(this.userService.logout({}))
  }

  async getUserInfo(data: { userId: string; username: string }) {
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
          return throwError(
            () =>
              new HttpException(
                error.details || 'Lỗi gRPC không xác định',
                HttpStatus.BAD_REQUEST,
              ),
          )
        }),
      ),
    )
  }

  async getAllWorkingPositions() {
    return await firstValueFrom(this.userService.getAllWorkingPositions({}))
  }

  async getWorkingPositionById(positionId: string) {
    return await lastValueFrom(
      this.userService.getWorkingPositionById({ positionId }),
    )
  }

  async deleteWorkingPosition(positionId: string) {
    return await lastValueFrom(
      this.userService.deleteWorkingPosition({ positionId }),
    )
  }

  async createDepartment(data: CreateDepartmentDto) {
    try {
      // Add timeout and retry mechanism
      const response = await firstValueFrom(
        this.userService.createDepartment(data).pipe(
          catchError((error) => {
            console.error('Department Creation Error:', error)

            // Specific error handling
            if (error.code === 14) {
              // Connection error
              return throwError(
                () =>
                  new HttpException(
                    'Dịch vụ không khả dụng. Vui lòng thử lại sau.',
                    HttpStatus.SERVICE_UNAVAILABLE,
                  ),
              )
            }

            return throwError(
              () =>
                new HttpException(
                  error.details || 'Lỗi không xác định khi tạo phòng ban',
                  HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            )
          }),
        ),
        { defaultValue: null }, // Prevent unhandled promise rejection
      )

      // Handle null response
      if (!response) {
        return new ApiResponse(
          false,
          'Không thể kết nối đến dịch vụ. Vui lòng kiểm tra kết nối.',
          null,
        )
      }

      return new ApiResponse(
        response.isSuccess,
        response.message || 'Thao tác thành công',
        response.data,
      )
    } catch (error) {
      console.error('Unexpected error in createDepartment:', error)

      // Log the full error for debugging
      return new ApiResponse(
        false,
        error.message || 'Lỗi hệ thống không xác định',
        null,
      )
    }
  }

  async getApartmentsByResidentId(
    residentId: string,
  ): Promise<{
    isSuccess: boolean
    message: string
    data: any[]
  }> {
    try {
      const response = await lastValueFrom(
        this.userService.getApartmentsByResidentId({ residentId }),
      )

      if (!response || typeof response !== 'object') {
        return {
          isSuccess: false,
          message: 'Invalid response from user service',
          data: [],
        }
      }

      return {
        isSuccess: response.isSuccess || response.success || false,
        message: response.message || 'Success',
        data: response.data || []
      }
    } catch (error) {
      return { isSuccess: false, message: 'Service unavailable', data: [] }
    }
  }

  async residentLogin(data: { phone: string; password: string }) {
    try {
      const response = await lastValueFrom(
        this.userService.residentLogin(data).pipe(
          catchError((error) => {
            console.error('Resident login error:', error)

            let errorMessage = 'Sai số điện thoại hoặc mật khẩu'
            let statusCode = HttpStatus.UNAUTHORIZED

            if (error && error.details) {
              if (error.details.includes('Tài khoản chưa được kích hoạt')) {
                errorMessage =
                  'Tài khoản chưa được kích hoạt, vui lòng liên hệ ban quản lý để được kích hoạt'
                statusCode = HttpStatus.UNAUTHORIZED
              } else if (
                error.details.includes('Sai số điện thoại hoặc mật khẩu')
              ) {
                errorMessage = 'Sai số điện thoại hoặc mật khẩu'
                statusCode = HttpStatus.UNAUTHORIZED
              } else {
                errorMessage = error.details
              }
            }

            throw new HttpException(errorMessage, statusCode)
          }),
        ),
      )

      return response
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      throw new HttpException(
        'Đăng nhập không thành công',
        HttpStatus.UNAUTHORIZED,
      )
    }
  }

  async updateResidentApartments(
    residentId: string,
    apartments: { apartmentName: string; buildingDetailId: string; warrantyDate?: string }[],
  ) {
    try {
      console.log("API Gateway - Received apartment data with warranty dates:",
        JSON.stringify(apartments.map(apt => ({
          name: apt.apartmentName,
          buildingId: apt.buildingDetailId,
          warrantyDate: apt.warrantyDate
        })), null, 2)
      );

      const response = await firstValueFrom(
        this.userService.updateResidentApartments({
          residentId,
          apartments
        }),
      )

      if (response.data && response.data.apartments) {
        // Đảm bảo dữ liệu warrantyDate được chuyển đúng
        console.log("API Gateway - Raw response from microservice:",
          JSON.stringify(response.data.apartments.map(apt => ({
            id: apt.apartmentId,
            name: apt.apartmentName,
            warrantyDate: apt.warrantyDate
          })), null, 2)
        );

        // Process the response to ensure warrantyDate is properly included
        const processedResponse = {
          ...response,
          data: {
            ...response.data,
            apartments: response.data.apartments.map(apt => {
              console.log(`API Gateway processing apartment ${apt.apartmentId}:`,
                JSON.stringify({
                  id: apt.apartmentId,
                  name: apt.apartmentName,
                  has_warrantyDate: apt.warrantyDate !== undefined,
                  warrantyDate: apt.warrantyDate,
                  warrantyDate_type: apt.warrantyDate !== undefined ? typeof apt.warrantyDate : 'undefined'
                }, null, 2)
              );

              // Lấy warrantyDate từ response mà không biến đổi gì cả
              return {
                ...apt,
                warrantyDate: apt.warrantyDate
              };
            })
          }
        };

        console.log("API Gateway - Processed final response with warranty dates:",
          JSON.stringify(processedResponse.data.apartments.map(apt => ({
            id: apt.apartmentId,
            name: apt.apartmentName,
            warrantyDate: apt.warrantyDate
          })), null, 2)
        );

        return processedResponse;
      }

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Lỗi khi thêm căn hộ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async updateAccountStatus(userId: string, accountStatus: string) {
    try {
      const response = await lastValueFrom(
        this.userService.updateAccountStatus({ userId, accountStatus }).pipe(
          catchError((error) => {
            console.error('Update account status error:', error)

            if (error.details) {
              if (error.details.includes('không tìm thấy')) {
                return throwError(
                  () => new HttpException(error.details, HttpStatus.NOT_FOUND),
                )
              }
            }

            return throwError(
              () =>
                new HttpException(
                  error.details || 'Lỗi khi cập nhật trạng thái tài khoản',
                  HttpStatus.INTERNAL_SERVER_ERROR,
                ),
            )
          }),
        ),
      )

      return response
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      throw new HttpException(
        'Lỗi hệ thống khi cập nhật trạng thái tài khoản',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async residentSignup(data: createUserDto) {
    try {
      // Set role to Resident
      data.role = 'Resident'
      const response = await firstValueFrom(
        this.userService.signup(data).pipe(
          catchError((error) => {
            return throwError(
              () =>
                new HttpException(
                  error.details || 'Lỗi gRPC không xác định',
                  HttpStatus.BAD_REQUEST,
                ),
            )
          }),
        ),
      )
      return response
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
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
            )
          }),
        ),
      )
      return response
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async updateDepartmentAndWorkingPosition(
    staffId: string,
    departmentId: string,
    positionId: string,
  ) {
    try {

      // First, verify that the department and position exist
      const departmentResponse = await firstValueFrom(
        this.userService.getDepartmentById({ departmentId }).pipe(
          catchError((error) => {
            return throwError(
              () =>
                new HttpException(
                  'Phòng ban không tồn tại',
                  HttpStatus.NOT_FOUND,
                ),
            )
          }),
        ),
      )

      const positionResponse = await firstValueFrom(
        this.userService.getWorkingPositionById({ positionId }).pipe(
          catchError((error) => {
            return throwError(
              () =>
                new HttpException(
                  'Vị trí công việc không tồn tại',
                  HttpStatus.NOT_FOUND,
                ),
            )
          }),
        ),
      )


      if (!departmentResponse.isSuccess || !positionResponse.isSuccess) {
        throw new HttpException(
          'Phòng ban hoặc vị trí công việc không tồn tại',
          HttpStatus.NOT_FOUND,
        )
      }

      // Update the staff's department and position
      try {
        const response = await lastValueFrom(
          this.userService.updateDepartmentAndWorkingPosition({
            staffId,
            departmentId,
            positionId
          }).pipe(
            catchError((error) => {

              // Check if the error message contains "not found" keywords
              const notFoundKeywords = ['không tìm thấy', 'not found', 'không tồn tại']

              // Determine if it's a "not found" type error
              let isNotFound = false
              if (error.details) {
                isNotFound = notFoundKeywords.some(keyword =>
                  error.details.toLowerCase().includes(keyword.toLowerCase())
                )
              } else if (error.message) {
                isNotFound = notFoundKeywords.some(keyword =>
                  error.message.toLowerCase().includes(keyword.toLowerCase())
                )
              }

              // Set appropriate status code based on error message
              const statusCode = isNotFound ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR

              // Return the specific error message from the microservice
              return throwError(
                () => new HttpException(
                  error.details || error.message || 'Lỗi không xác định',
                  statusCode
                ),
              )
            }),
          ),
        )

        return response
      } catch (innerError) {
        throw innerError // Rethrow to be caught by outer catch
      }
    } catch (error) {

      if (error instanceof HttpException) {
        throw error
      }

      // Provide more detailed error information
      const errorMessage = error.message || 'Lỗi hệ thống không xác định'

      // Check if the error message contains "not found" keywords
      const notFoundKeywords = ['không tìm thấy', 'not found', 'không tồn tại']
      const isNotFound = notFoundKeywords.some(keyword =>
        errorMessage.toLowerCase().includes(keyword.toLowerCase())
      )

      throw new HttpException(
        `Lỗi khi cập nhật phòng ban và vị trí công việc: ${errorMessage}`,
        isNotFound ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
