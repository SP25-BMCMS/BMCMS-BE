import { Body, Controller, Get, Inject, Param, Post, Put, Query, Sse, UseGuards } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { ApiOperation, ApiParam, ApiQuery, ApiTags, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { NOTIFICATION_CLIENT } from '../constraints'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { CreateNotificationDto, MarkNotificationReadDto } from '@app/contracts/notifications/notification.dto'
import { firstValueFrom, Observable } from 'rxjs'
import { IsNotEmpty, Length } from 'class-validator'
import { IsEmail } from 'class-validator'
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard'

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
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(@Inject(NOTIFICATION_CLIENT) private client: ClientProxy) { }

  @Get('user/:userId')
  @UseGuards(PassportJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng' })
  @ApiParam({ name: 'userId', type: 'string', description: 'ID của người dùng' })
  async getUserNotifications(@Param('userId') userId: string) {
    try {
      const response = await firstValueFrom(
        this.client.send(NOTIFICATIONS_PATTERN.GET_USER_NOTIFICATIONS, { userId })
      )
      return response
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch notifications',
        data: null
      }
    }
  }

  @Put('read/:notificationId')
  @UseGuards(PassportJwtAuthGuard)
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  @ApiParam({ name: 'notificationId', type: 'string', description: 'ID của thông báo' })
  async markNotificationRead(@Param('notificationId') notificationId: string) {
    try {
      const data: MarkNotificationReadDto = { notificationId }
      const response = await firstValueFrom(
        this.client.send(NOTIFICATIONS_PATTERN.MARK_NOTIFICATION_READ, data)
      )
      return response
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to mark notification as read',
        data: null
      }
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo thông báo mới (debug only)' })
  @ApiBody({ type: CreateNotificationDto })
  async createNotification(@Body() createDto: CreateNotificationDto) {
    try {
      const response = await firstValueFrom(
        this.client.emit(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION, createDto)
      )
      return response
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create notification',
        data: null
      }
    }
  }

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

  // Thêm endpoint mới cho realtime notifications sử dụng SSE
  @Sse('stream/:userId')
  @UseGuards(PassportJwtAuthGuard)
  @ApiOperation({ summary: 'Stream realtime notifications' })
  @ApiParam({ name: 'userId', type: 'string', description: 'ID của người dùng' })
  streamNotifications(@Param('userId') userId: string): Observable<MessageEvent> {
    // Gửi message tới notification microservice để thiết lập kênh stream
    return this.client.send<MessageEvent>(
      'notification.stream', // Thêm pattern này vào NOTIFICATIONS_PATTERN
      { userId }
    )
  }
}
