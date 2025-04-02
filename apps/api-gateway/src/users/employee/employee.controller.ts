import { Controller, Get, HttpStatus, Res, Param, Query } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { lastValueFrom } from 'rxjs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Employee')
@Controller('employee')
export class EmployeeController {
  constructor(private employeeService: EmployeeService) { }

  @Get('all-staff')
  @ApiOperation({ summary: 'Get all staff members with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by username, email or phone' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['Admin', 'Manager', 'Staff'],
    isArray: true,
    description: 'Filter by role(s). Can provide multiple values like ?role=Admin&role=Manager'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved staff members',
    schema: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully retrieved staff members' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              role: { type: 'string', enum: ['Admin', 'Manager', 'Staff'] },
              dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
              gender: { type: 'string', nullable: true },
              accountStatus: { type: 'string', enum: ['Active', 'Inactive'] },
              userDetails: {
                type: 'object',
                nullable: true,
                properties: {
                  position: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      positionId: { type: 'string' },
                      positionName: { type: 'string' },
                      description: { type: 'string' }
                    }
                  },
                  department: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      departmentId: { type: 'string' },
                      departmentName: { type: 'string' },
                      description: { type: 'string' },
                      area: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 10 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'No staff members found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAllStaff(
    @Query() query,
    @Res() res: any
  ) {
    try {
      const { page, limit, search, role } = query;

      // Convert role parameter to array if it's a single string
      let roleArray = role;
      if (role && !Array.isArray(role)) {
        roleArray = [role];
      }

      const paginationParams = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        search,
        role: roleArray
      };

      const response = await this.employeeService.getAllStaff(paginationParams);

      if (!response.isSuccess) {
        return res.status(HttpStatus.NOT_FOUND).json(response);
      }

      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        isSuccess: false,
        message: 'Failed to retrieve staff members',
        data: null,
        error: error.message,
        pagination: {
          total: 0,
          page: parseInt(query?.page) || 1,
          limit: parseInt(query?.limit) || 10,
          totalPages: 0
        }
      });
    }
  }

  @Get('check-area-match/:staffId/:crackReportId')
  @ApiOperation({ summary: 'Check if staff is assigned to the same area as a crack report' })
  @ApiResponse({
    status: 200,
    description: 'Successfully checked area match',
    schema: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Area match found' },
        isMatch: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Staff or crack report not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async checkStaffAreaMatch(
    @Param('staffId') staffId: string,
    @Param('crackReportId') crackReportId: string,
    @Res() res: any
  ) {
    try {
      const response = await this.employeeService.checkStaffAreaMatch(staffId, crackReportId);

      if (!response.isSuccess) {
        return res.status(HttpStatus.NOT_FOUND).json(response);
      }

      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        isSuccess: false,
        message: 'Failed to check area match',
        isMatch: false,
        error: error.message
      });
    }
  }

  @Get('staff-detail/:staffId')
  @ApiOperation({ summary: 'Get detailed information about a staff member' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved staff details',
    schema: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Staff details retrieved successfully, including position and department information' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['Admin', 'Manager', 'Staff'] },
            dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
            gender: { type: 'string', nullable: true },
            accountStatus: { type: 'string', enum: ['Active', 'Inactive'] },
            userDetails: {
              type: 'object',
              properties: {
                position: {
                  type: 'object',
                  properties: {
                    positionId: { type: 'string' },
                    positionName: { type: 'string' },
                    description: { type: 'string' }
                  }
                },
                department: {
                  type: 'object',
                  properties: {
                    departmentId: { type: 'string' },
                    departmentName: { type: 'string' },
                    description: { type: 'string' },
                    area: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUserDetailByStaffId(
    @Param('staffId') staffId: string,
    @Res() res: any
  ) {
    try {
      const response = await this.employeeService.getUserDetailByStaffId(staffId);

      if (!response.isSuccess) {
        return res.status(HttpStatus.NOT_FOUND).json(response);
      }

      // If userDetails exists but position or department is missing, we'll add placeholders
      if (response.data?.userDetails &&
        (!response.data.userDetails.position || Object.keys(response.data.userDetails.position).length === 1 ||
          !response.data.userDetails.department || Object.keys(response.data.userDetails.department).length === 1)) {

        // Create a deep clone to avoid modifying the original
        const enhancedResponse = JSON.parse(JSON.stringify(response));

        if (!enhancedResponse.data.userDetails.position || Object.keys(enhancedResponse.data.userDetails.position).length === 1) {
          enhancedResponse.data.userDetails.position = {
            positionId: enhancedResponse.data.userDetails.positionId,
            positionName: 'Default Position Name', // Placeholder text for UI
            description: 'Position details not available'
          };
        }

        if (!enhancedResponse.data.userDetails.department || Object.keys(enhancedResponse.data.userDetails.department).length === 1) {
          enhancedResponse.data.userDetails.department = {
            departmentId: enhancedResponse.data.userDetails.departmentId,
            departmentName: 'Default Department Name', // Placeholder text for UI
            description: 'Department details not available',
            area: 'Default Area'
          };
        }

        // Return enhanced response
        return res.status(HttpStatus.OK).json({
          ...enhancedResponse,
          message: 'Staff details retrieved successfully, including position and department information'
        });
      }

      // Enhance response with a clear message about what data includes
      return res.status(HttpStatus.OK).json({
        ...response,
        message: 'Staff details retrieved successfully, including position and department information'
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        isSuccess: false,
        message: 'Failed to retrieve staff details',
        data: null,
        error: error.message,
      });
    }
  }


}
