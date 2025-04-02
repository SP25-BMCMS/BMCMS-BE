import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { DepartmentService } from './department.service';

@Controller('departments')
@ApiTags('departments')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) { }

    @Get()
    @ApiOperation({ summary: 'Get all departments' })
    @SwaggerResponse({
        status: 200,
        description: 'Departments retrieved successfully',
        schema: {
            example: {
                isSuccess: true,
                message: 'All departments retrieved successfully',
                data: [
                    {
                        departmentId: '123e4567-e89b-12d3-a456-426614174000',
                        departmentName: 'Maintenance',
                        description: 'Responsible for building maintenance',
                        area: 'North Wing'
                    },
                    {
                        departmentId: '223e4567-e89b-12d3-a456-426614174000',
                        departmentName: 'Security',
                        description: 'Responsible for building security',
                        area: 'All Areas'
                    }
                ]
            }
        }
    })
    @SwaggerResponse({ status: 500, description: 'Internal server error' })
    async getAllDepartments(@Res() res: any) {
        try {
            const response = await this.departmentService.getAllDepartments();
            return res.status(HttpStatus.OK).json(response);
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message || 'Lỗi khi lấy danh sách phòng ban'
            });
        }
    }
} 