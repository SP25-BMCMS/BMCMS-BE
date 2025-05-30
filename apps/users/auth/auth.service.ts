import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto'
import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ClientProxy, RpcException } from '@nestjs/microservices'
import * as bcrypt from 'bcrypt'
import { ApiResponse } from '../../../libs/contracts/src/ApiResponse/api-response'
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto'
import { CreateWorkingPositionDto } from '../../../libs/contracts/src/users/create-working-position.dto'
import { UsersService } from '../users/users.service'
import { firstValueFrom } from 'rxjs'

type AuthInput = { username: string; password: string }
type SignInData = { userId: string; username: string; role: string }
type AuthResult = {
  accessToken: string
  refreshToken: string
  userId: string
  username: string
}

const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(NOTIFICATION_CLIENT) private client: ClientProxy,
  ) { }

  async signIn(user: SignInData): Promise<AuthResult> {
    const tokenPayload = {
      sub: user.userId,
      username: user.username,
      role: user.role,
    }
    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: '12h',
    })
    const refreshToken = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: '1d',
    })

    return {
      accessToken,
      refreshToken,
      userId: user.userId,
      username: user.username,
    }
  }

  async authenticate(input: AuthInput): Promise<AuthResult> {
    const user = await this.validateUser(input)
    return this.signIn(user)
  }

  async logout(): Promise<{ message: string }> {
    return { message: 'Đăng xuất thành công' }
  }

  async validateUser(input: AuthInput) {
    const user = await this.usersService.getUserByUsername(input.username)
    const isPasswordValid = await bcrypt.compare(input.password, user.password)

    if (!isPasswordValid)
      throw new RpcException({
        statusCode: 401,
        message: 'Thông tin đăng nhập không hợp lệ!',
      })

    // Check if account is inactive
    if (user.accountStatus === 'Inactive')
      throw new RpcException({
        statusCode: 403,
        message: 'Tài khoản đang không hoạt động. Vui lòng liên hệ quản trị viên để kích hoạt.',
      })

    return { userId: user.userId, username: user.username, role: user.role }
  }

  async validateResidentByPhone(phone: string, password: string) {
    try {
      const user = await this.usersService.getUserByPhone(phone)

      if (user.role !== 'Resident') {
        throw new RpcException({
          statusCode: 401,
          message: 'Số điện thoại hoặc mật khẩu không chính xác',
        })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        throw new RpcException({
          statusCode: 401,
          message: 'Số điện thoại hoặc mật khẩu không chính xác',
        })
      }

      if (user.accountStatus === 'Inactive') {
        throw new RpcException({
          statusCode: 401,
          message:
            'Tài khoản chưa được kích hoạt, vui lòng liên hệ ban quản lý để kích hoạt',
        })
      }

      return {
        userId: user.userId,
        username: user.username,
        role: user.role,
      }
    } catch (error) {
      if (error instanceof RpcException) throw error

      throw new RpcException({
        statusCode: 401,
        message: 'Số điện thoại hoặc mật khẩu không chính xác',
      })
    }
  }

  async residentLogin(data: {
    phone: string
    password: string
  }): Promise<AuthResult> {
    const user = await this.validateResidentByPhone(data.phone, data.password)
    return this.signIn(user)
  }

  async signup(data: createUserDto): Promise<ApiResponse<any>> {
    try {
      // Check if username exists
      try {
        const existingUsername = await this.usersService.getUserByUsername(
          data.username,
        )
        if (existingUsername) {
          throw new RpcException({
            statusCode: 400,
            message: 'Tên đăng nhập đã tồn tại',
          })
        }
      } catch (error) {
        // Ignore error if user not found
        if (
          error instanceof RpcException &&
          error.message !== 'Số điện thoại hoặc mật khẩu không chính xác'
        ) {
          throw error
        }
      }

      // Check if email exists
      try {
        const existingEmail = await this.usersService.getUserByEmail(
          data.email,
        )
        if (existingEmail) {
          throw new RpcException({
            statusCode: 400,
            message: 'Email đã tồn tại',
          })
        }
      } catch (error) {
        // Ignore error if user not found
        if (
          error instanceof RpcException &&
          error.message !== 'Email không tồn tại'
        ) {
          throw error
        }
      }

      // Check if phone exists
      try {
        const existingPhone = await this.usersService.getUserByPhone(
          data.phone,
        )
        if (existingPhone) {
          throw new RpcException({
            statusCode: 400,
            message: 'Số điện thoại đã tồn tại',
          })
        }
      } catch (error) {
        // Ignore error if user not found
        if (
          error instanceof RpcException &&
          error.message !== 'Số điện thoại hoặc mật khẩu không chính xác'
        ) {
          throw error
        }
      }

      // For Resident role, generate and send OTP first
      if (data.role === 'Resident') {
        // Use emit() with event pattern
        this.client.emit('send_otp_message', { email: data.email });

        return new ApiResponse(true, 'Mã OTP đã được gửi đến email của bạn', {
          email: data.email,
        });
      }
      // For other roles, proceed with normal signup
      return await this.usersService.signup(data)

    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi hệ thống trong quá trình đăng ký',
      })
    }
  }

  async verifyOtpAndCompleteSignup(data: {
    email: string
    otp: string
    userData: createUserDto
  }): Promise<ApiResponse<any>> {
    try {
      // Check if email in OTP verification matches email in userData
      if (data.email !== data.userData.email) {
        throw new RpcException({
          statusCode: 400,
          message: 'Email xác thực OTP phải trùng với email đăng ký',
        })
      }

      // Verify OTP and mark as used
      const otpResponse = await this.client.send('verify_otp', { email: data.email, otp: data.otp }).toPromise()

      // Fixed checking logic: check if response is invalid or has success=false
      if (!otpResponse || otpResponse.success === false) {
        console.error('OTP verification failed:', otpResponse?.message || 'Unknown error')
        throw new RpcException({
          statusCode: 400,
          message: otpResponse?.message || 'Xác thực OTP thất bại',
        })
      }

      // Create user account
      const response = await this.usersService.signup(data.userData)

      if (!response.isSuccess) {
        throw new RpcException({
          statusCode: 400,
          message: response.message,
        })
      }

      // Return user data without sensitive information
      const userData = response.data
      const userResponse = {
        userId: userData.userId,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        accountStatus: userData.accountStatus,
      }

      return new ApiResponse(true, 'Đăng ký thành công', userResponse)
    } catch (error) {
      console.error('Error in verifyOtpAndCompleteSignup:', error)
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 400,
        message: error.message || 'Xác thực OTP thất bại',
      })
    }
  }

  // Working Position Methods
  async createWorkingPosition(data: CreateWorkingPositionDto) {
    return this.usersService.createWorkingPosition(data)
  }

  async getAllWorkingPositions() {
    return this.usersService.getAllWorkingPositions()
  }

  async getWorkingPositionById(data: { positionId: string }) {
    return this.usersService.getWorkingPositionById(data)
  }

  async deleteWorkingPosition(data: { positionId: string }) {
    return this.usersService.deleteWorkingPosition(data)
  }

  // Department Methods
  async createDepartment(data: CreateDepartmentDto) {
    return this.usersService.createDepartment(data)
  }

  async getUserInfo(userId: string) {
    return this.usersService.getUserById(userId)
  }
}
