import { Controller, Get, HttpStatus, Res, Param } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { lastValueFrom } from 'rxjs';

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
        error: error.message,
      });
    }
  }

  @Get('check-area-match/:staffId/:crackReportId')
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
