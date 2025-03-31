import { Body, Controller, Inject, Post } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { ApiOperation, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger'
import { NOTIFICATION_CLIENT } from '../constraints'
import { IsEmail, IsNotEmpty, Length } from 'class-validator'

class SendOtpDto {
  email: string
}

class VerifyOtpDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string

  @IsNotEmpty({ message: 'OTP không được để trống' })
  @Length(6, 6, { message: 'OTP phải có đúng 6 chữ số' })
  otp: string
}

class OtpResponse {
  status: string
  email: string
}

@Controller('notifications')
@ApiTags('notifications')
export class NotificationsController {
  constructor(@Inject(NOTIFICATION_CLIENT) private client: ClientProxy) { }

  @Post('send-otp')
  @ApiOperation({ summary: 'Request OTP verification' })
  @ApiBody({
    description: 'Provide email to request an OTP',
    type: SendOtpDto,
    examples: {
      example1: {
        value: { email: 'user@example.com' },
        description: 'Example request to receive an OTP',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'OTP request sent successfully',
    type: OtpResponse,
  })
  async sendOtp(@Body('email') email: string) {
    this.client.emit('send_otp', { email })
    return { status: 'OTP_REQUEST_SENT', email }
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiBody({
    description: 'Provide email and OTP code for verification',
    type: VerifyOtpDto,
    examples: {
      example1: {
        value: { email: 'user@example.com', otp: '123456' },
        description: 'Example request to verify OTP',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or expired',
  })
  async verifyOtp(@Body() data: VerifyOtpDto) {
    return this.client.send('verify_otp', data)
  }
}
