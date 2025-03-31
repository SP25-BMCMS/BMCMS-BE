import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';
import { LoginDto } from '@app/contracts/users/login.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client-users';
import { createUserDto } from 'libs/contracts/src/users/create-user.dto';
import { CreateWorkingPositionDto } from 'libs/contracts/src/users/create-working-position.dto';
import { Roles } from '../../decorator/roles.decarator';
import { PassportJwtAuthGuard } from '../../guards/passport-jwt-guard';
import { PassportLocalGuard } from '../../guards/passport-local-guard';
import { RolesGuard } from '../../guards/role.guard';
import { UsersService } from './users.service';

@Controller('auth')
@ApiTags('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @UseGuards(PassportLocalGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: LoginDto })
  @SwaggerResponse({ status: 200, description: 'Login successful' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  login(@Body() data: LoginDto) {
    return this.usersService.login(data);
  }

  @Post('resident/login')
  @ApiOperation({ summary: 'Login for residents using phone and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '0123456789' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['phone', 'password'],
    },
  })
  @SwaggerResponse({ status: 200, description: 'OTP sent successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async residentLogin(
    @Body() data: { phone: string; password: string },
    @Res() res: any,
  ) {
    try {
      const response = await this.usersService.residentLogin(data);
      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.UNAUTHORIZED;

      const message =
        error instanceof HttpException
          ? error.message
          : 'Đăng nhập không thành công';

      return res.status(status).json({
        statusCode: status,
        message: message,
      });
    }
  }

  @Post('resident/verify-otp')
  @ApiOperation({ summary: 'Verify OTP and complete resident login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '0123456789' },
        otp: { type: 'string', example: '123456' },
      },
      required: ['phone', 'otp'],
    },
  })
  @SwaggerResponse({ status: 200, description: 'Login successful' })
  @SwaggerResponse({ status: 401, description: 'Invalid OTP' })
  async verifyOtpAndLogin(
    @Body() data: { phone: string; otp: string },
    @Res() res: any,
  ) {
    try {
      const response = await this.usersService.verifyOtpAndLogin(data);
      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.UNAUTHORIZED;

      const message =
        error instanceof HttpException ? error.message : 'Mã OTP không hợp lệ';

      return res.status(status).json({
        statusCode: status,
        message: message,
      });
    }
  }

  @UseGuards(PassportJwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user information' })
  @SwaggerResponse({
    status: 200,
    description: 'User information retrieved successfully',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  getUserInfo(@Req() req) {
    return this.usersService.getUserInfo(req.user);
  }

  @Post('signup')
  @ApiOperation({
    summary: 'Sign up a new user',
    description:
      'For Resident role: Sends OTP to email for verification. For other roles: Creates account directly.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'john_doe' },
        email: { type: 'string', example: 'john@example.com' },
        password: { type: 'string', example: 'password123' },
        phone: { type: 'string', example: '0123456789' },
        role: { type: 'string', example: 'Resident' },
        dateOfBirth: {
          type: 'string',
          format: 'date-time',
          example: '1990-01-01T00:00:00.000Z',
        },
        gender: { type: 'string', example: 'Male' },
      },
      required: ['username', 'email', 'password', 'phone', 'role'],
    },
  })
  @SwaggerResponse({
    status: 201,
    description:
      'For Resident: OTP sent successfully. For other roles: User created successfully',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Mã OTP đã được gửi đến email của bạn',
        },
        data: {
          type: 'object',
          properties: {
            email: { type: 'string', example: 'john@example.com' },
          },
        },
      },
    },
  })
  @SwaggerResponse({
    status: 400,
    description: 'Bad request - User already exists',
  })
  async signup(@Body() data: createUserDto, @Res() res: any) {
    try {
      const response = await this.usersService.signup(data);
      return res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.BAD_REQUEST;

      const message =
        error instanceof HttpException
          ? error.message
          : 'Đăng ký không thành công';

      return res.status(status).json({
        statusCode: status,
        message: message,
      });
    }
  }

  @Post('verify-otp-signup')
  @ApiOperation({
    summary: 'Verify OTP and complete signup for resident',
    description:
      "Verify OTP sent to resident's email and complete the registration process. Email in verification must match email in userData.",
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'john@example.com',
          description:
            'Email that received the OTP (must match email in userData)',
        },
        otp: {
          type: 'string',
          example: '123456',
          description: '6-digit OTP code received via email',
        },
        userData: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              example: 'john_doe',
              description: 'Unique username for the account',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
              description:
                'Email address (must match the email that received OTP)',
            },
            password: {
              type: 'string',
              example: 'password123',
              description: 'Password (min 6 characters)',
            },
            phone: {
              type: 'string',
              example: '0123456789',
              description: 'Phone number',
            },
            role: {
              type: 'string',
              example: 'Resident',
              description: 'User role (must be Resident)',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date-time',
              example: '1990-01-01T00:00:00.000Z',
              description: 'Optional date of birth',
            },
            gender: {
              type: 'string',
              example: 'Male',
              description: 'Optional gender',
            },
          },
          required: ['username', 'email', 'password', 'phone', 'role'],
        },
      },
      required: ['email', 'otp', 'userData'],
    },
  })
  @SwaggerResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Đăng ký thành công' },
        data: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
            phone: { type: 'string', example: '0123456789' },
            role: { type: 'string', example: 'Resident' },
            dateOfBirth: {
              type: 'string',
              example: '1990-01-01T00:00:00.000Z',
            },
            gender: { type: 'string', example: 'Male' },
            accountStatus: { type: 'string', example: 'Inactive' },
          },
        },
      },
    },
  })
  @SwaggerResponse({
    status: 400,
    description: 'Invalid OTP or email mismatch',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Email xác thực OTP phải khớp với email đăng ký',
        },
      },
    },
  })
  @SwaggerResponse({
    status: 409,
    description: 'Username or email already exists',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Username hoặc Email đã tồn tại' },
      },
    },
  })
  async verifyOtpAndCompleteSignup(
    @Body() data: { email: string; otp: string; userData: createUserDto },
    @Res() res: any,
  ) {
    try {
      const response = await this.usersService.verifyOtpAndCompleteSignup(data);
      return res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.BAD_REQUEST;

      const message =
        error instanceof HttpException
          ? error.message
          : 'Xác thực OTP thất bại';

      return res.status(status).json({
        statusCode: status,
        message: message,
      });
    }
  }

  @UseGuards(PassportJwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current user' })
  @SwaggerResponse({ status: 200, description: 'Logout successful' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  logout() {
    return this.usersService.logout();
  }

  @UseGuards(PassportJwtAuthGuard, RolesGuard)
  @Get('all-users')
  @Roles(Role.Admin)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @SwaggerResponse({ status: 200, description: 'Users retrieved successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get()
  @ApiOperation({ summary: 'Test endpoint' })
  test(@Body() data: { username: string; password: string }) {
    return this.usersService.test(data);
  }

  // Working Position Methods
  @Post('working-position')
  @ApiOperation({ summary: 'Create a new working position' })
  @ApiBody({ type: CreateWorkingPositionDto })
  @SwaggerResponse({
    status: 201,
    description: 'Working position created successfully',
  })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  async createWorkingPosition(@Body() data: CreateWorkingPositionDto) {
    return this.usersService.createWorkingPosition(data);
  }

  @Get('working-positions')
  @ApiOperation({ summary: 'Get all working positions' })
  @SwaggerResponse({
    status: 200,
    description: 'Working positions retrieved successfully',
  })
  async getAllWorkingPositions() {
    return this.usersService.getAllWorkingPositions();
  }

  @Get('working-position/:positionId')
  @ApiOperation({ summary: 'Get working position by ID' })
  @ApiParam({ name: 'positionId', description: 'Working position ID' })
  @SwaggerResponse({
    status: 200,
    description: 'Working position retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Working position not found' })
  async getWorkingPositionById(@Param('positionId') positionId: string) {
    return this.usersService.getWorkingPositionById(positionId);
  }

  @Delete('working-position/:positionId')
  @ApiOperation({ summary: 'Delete working position by ID' })
  @ApiParam({ name: 'positionId', description: 'Working position ID' })
  @SwaggerResponse({
    status: 200,
    description: 'Working position deleted successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Working position not found' })
  async deleteWorkingPosition(@Param('positionId') positionId: string) {
    return this.usersService.deleteWorkingPosition(positionId);
  }

  @Post('department')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiBody({ type: CreateDepartmentDto })
  @SwaggerResponse({
    status: 201,
    description: 'Department created successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Not found' })
  async createDepartment(@Body() data: CreateDepartmentDto, @Res() res: any) {
    const response = await this.usersService.createDepartment(data);

    if (!response.isSuccess) {
      return res.status(HttpStatus.NOT_FOUND).json(response);
    }

    return res.status(HttpStatus.CREATED).json(response);
  }

  @Get('apartments/:residentId')
  @ApiOperation({ summary: 'Get apartments by resident ID' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @SwaggerResponse({
    status: 200,
    description: 'Apartments retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Resident not found' })
  async getApartmentsByResidentId(
    @Param('residentId') residentId: string,
    @Res() res: any,
  ) {
    const response =
      await this.usersService.getApartmentsByResidentId(residentId);

    if (!response.isSuccess) {
      return res.status(HttpStatus.NOT_FOUND).json(response);
    }

    return res.status(HttpStatus.OK).json(response);
  }

  @UseGuards(PassportJwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch('resident/:residentId/apartments')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update resident apartments (Admin only)' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        apartments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              apartmentName: { type: 'string', example: 'A101' },
              buildingDetailId: { type: 'string', example: '12345' },
            },
            required: ['apartmentName', 'buildingDetailId'],
          },
        },
      },
      required: ['apartments'],
    },
  })
  @SwaggerResponse({
    status: 200,
    description: 'Apartments updated successfully',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @SwaggerResponse({ status: 404, description: 'Resident not found' })
  async updateResidentApartments(
    @Param('residentId') residentId: string,
    @Body()
    data: { apartments: { apartmentName: string; buildingDetailId: string }[] },
    @Res() res: any,
  ) {
    try {
      const response = await this.usersService.updateResidentApartments(
        residentId,
        data.apartments,
      );
      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const message =
        error instanceof HttpException
          ? error.message
          : 'Lỗi khi cập nhật căn hộ';

      return res.status(status).json({
        statusCode: status,
        message: message,
      });
    }
  }

  @UseGuards(PassportJwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch('update-account-status/:userId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user account status (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountStatus: { type: 'string', example: 'Active' },
      },
      required: ['accountStatus'],
    },
  })
  @SwaggerResponse({
    status: 200,
    description: 'Account status updated successfully',
  })
  @SwaggerResponse({
    status: 404,
    description: 'User not found',
  })
  @SwaggerResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @SwaggerResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async updateAccountStatus(
    @Param('userId') userId: string,
    @Body() data: { accountStatus: string },
    @Res() res: any,
  ) {
    try {
      const { accountStatus } = data;
      const response = await this.usersService.updateAccountStatus(
        userId,
        accountStatus,
      );

      // Kiểm tra kết quả trả về từ service để quyết định status code
      if (!response.isSuccess) {
        // Nếu message chứa "không tìm thấy" hoặc "not found", trả về 404
        if (
          response.message &&
          (response.message.toLowerCase().includes('không tìm thấy') ||
            response.message.toLowerCase().includes('not found'))
        ) {
          return res.status(HttpStatus.NOT_FOUND).json(response);
        }

        // Các trường hợp lỗi khác
        return res.status(HttpStatus.BAD_REQUEST).json(response);
      }

      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const message =
        error instanceof HttpException
          ? error.message
          : 'Lỗi khi cập nhật trạng thái tài khoản';

      return res.status(status).json({
        statusCode: status,
        message: message,
      });
    }
  }
}

// @Get('apartment/:apartmentId')
// async getApartmentById(@Param('apartmentId') apartmentId: string) {
//   return this.usersService.({ apartmentId });
// }
