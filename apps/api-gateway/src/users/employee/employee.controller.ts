import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { EmployeeService } from './employee.service';

@Controller('employee')
export class EmployeeController {
    constructor(private employeeService: EmployeeService) { }

    @Get('all-staff')
    async getAllStaff(@Res() res: any) {
        try {
            const response = await this.employeeService.getAllStaff();

            if (!response.isSuccess) {
                return res.status(HttpStatus.NOT_FOUND).json(response);
            }

            return res.status(HttpStatus.OK).json(response);
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                isSuccess: false,
                message: 'Failed to retrieve staff members',
                data: null,
                error: error.message
            });
        }
    }
}
