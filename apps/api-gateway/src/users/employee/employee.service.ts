import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { USERS_CLIENT } from '../../constraints';
import { UserInterface } from '../user/users.interface';
import { catchError, of } from 'rxjs';

@Injectable()
export class EmployeeService implements OnModuleInit {
  private userService: UserInterface;

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) { }

  onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService');
  }

  async getAllStaff(paginationParams: { page?: number; limit?: number; search?: string; role?: string | string[] } = {}) {
    try {
      // Ensure role is passed as array if provided
      const params = {
        ...paginationParams,
        role: paginationParams.role ?
          (Array.isArray(paginationParams.role) ?
            paginationParams.role : [paginationParams.role]) :
          undefined
      };

      const response = await lastValueFrom(this.userService.getAllStaff(params));

      if (!response || !response.isSuccess) {
        return {
          isSuccess: false,
          message: response?.message || 'Failed to retrieve staff members',
          data: [],
          pagination: {
            total: 0,
            page: paginationParams.page || 1,
            limit: paginationParams.limit || 10,
            totalPages: 0
          }
        };
      }

      return response;
    } catch (error) {
      console.error('Error in getAllStaff:', error);
      return {
        isSuccess: false,
        message: 'Service unavailable',
        data: [],
        pagination: {
          total: 0,
          page: paginationParams.page || 1,
          limit: paginationParams.limit || 10,
          totalPages: 0
        }
      };
    }
  }

  async checkStaffAreaMatch(staffId: string, crackReportId: string) {
    try {
      const response = await lastValueFrom(
        this.userService.checkStaffAreaMatch({ staffId, crackReportId })
      );

      if (!response || !response.isSuccess) {
        return {
          isSuccess: false,
          message: response?.message || 'Failed to check area match',
          isMatch: false
        };
      }

      return response;
    } catch (error) {
      console.error('Error in checkStaffAreaMatch:', error);
      return {
        isSuccess: false,
        message: 'Service unavailable',
        isMatch: false
      };
    }
  }

  async getUserDetailByStaffId(staffId: string) {
    try {
      const response = await lastValueFrom(
        this.userService.getUserInfo({ userId: staffId, username: '' })
      );

      if (!response) {
        return {
          isSuccess: false,
          message: 'Failed to retrieve staff details',
          data: null,
        };
      }

      // Verify that this is a staff user
      if (response.role !== 'Staff' && response.role !== 'Manager' && response.role !== 'Admin') {
        return {
          isSuccess: false,
          message: 'User is not a staff member',
          data: null,
        };
      }

      // *** First get the department directly as a separate call ***
      let departmentData = null;
      if (response.userDetails && response.userDetails.departmentId) {

      }

      // Solve position and department data missing issue
      if (response.userDetails) {
        // Test gRPC response for position and department properties
        if (!response.userDetails.position || Object.keys(response.userDetails.position).length <= 1) {
          // Need to fetch position directly
          try {
            const positionResponse = await lastValueFrom(
              this.userService.getWorkingPositionById({ positionId: response.userDetails.positionId })
            );

            if (positionResponse?.isSuccess && positionResponse?.data) {

              // Apply position data
              response.userDetails.position = {
                positionId: positionResponse.data.positionId,
                positionName: typeof positionResponse.data.positionName === 'number'
                  ? this.mapPositionNameFromNumber(positionResponse.data.positionName)
                  : positionResponse.data.positionName,
                description: positionResponse.data.description || ''
              };
            }
          } catch (error) {
          }
        } else if (response.userDetails.position && typeof response.userDetails.position.positionName === 'number') {
          // Convert positionName from number to string if it's a number
          response.userDetails.position.positionName = this.mapPositionNameFromNumber(response.userDetails.position.positionName);
        }

        // Test and fetch department data if needed
        if (!response.userDetails.department ||
          Object.keys(response.userDetails.department).length <= 1 ||
          response.userDetails.department.departmentName === 'Unknown Department') {

          if (departmentData) {
            // Use the data we got from direct call
            response.userDetails.department = departmentData;
          } else {
            try {
              try {
                // Attempt to fetch department data using the getDepartmentById method in UserInterface                
                const departmentResponse = await lastValueFrom(
                  this.userService.getDepartmentById({ departmentId: response.userDetails.departmentId })
                    .pipe(
                      catchError(error => {
                        return of(null);
                      })
                    )
                );

                if (departmentResponse && departmentResponse.isSuccess && departmentResponse.data) {
                  // Apply department data
                  response.userDetails.department = {
                    departmentId: departmentResponse.data.departmentId,
                    departmentName: departmentResponse.data.departmentName,
                    description: departmentResponse.data.description || '',
                    area: departmentResponse.data.area || 'Unknown'
                  };
                }
              } catch (error) {
                // If the method is not implemented or fails, we'll use the fallback
              }

            } catch (error) {
              // Error handling fallback
            }
          }
        }
      }

      // Create complete data object
      const data = {
        ...response,
        // Ensure the userDetails object has proper nested objects
        userDetails: response.userDetails ? {
          ...response.userDetails,
          position: response.userDetails.position ? {
            ...response.userDetails.position,
            // Ensure positionName is a string
            positionName: typeof response.userDetails.position.positionName === 'number'
              ? this.mapPositionNameFromNumber(response.userDetails.position.positionName)
              : response.userDetails.position.positionName || 'Unknown Position'
          } : {
            positionId: response.userDetails.positionId,
            positionName: 'Unknown Position',
            description: 'Position data unavailable'
          },
          department: response.userDetails.department || (departmentData || {
            departmentId: response.userDetails.departmentId,
            departmentName: 'Unknown Department',
            description: 'Department data unavailable',
            area: 'Unknown Area'
          })
        } : null
      };

      return {
        isSuccess: true,
        message: 'Staff details retrieved successfully',
        data,
      };
    } catch (error) {
      // Clean error message - remove gRPC error code prefix if present
      let errorMessage = error.message || 'Service unavailable';

      // Check if error message has format like "2 UNKNOWN: StaffId not found"
      if (errorMessage.match(/^\d+\s+\w+:\s+/)) {
        // Extract only the actual message part after the code and colon
        errorMessage = errorMessage.replace(/^\d+\s+\w+:\s+/, '');
      }

      return {
        isSuccess: false,
        message: errorMessage,
        data: null,
      };
    }
  }

  private mapPositionNameFromNumber(positionNumber: number): string {
    const positionMap = {
      0: 'Staff',
      1: 'Leader',
      2: 'Manager',
      3: 'Admin'
    };
    return positionMap[positionNumber] || `Unknown Position (${positionNumber})`;
  }

  async getAllStaffByStaffLeader(staffId: string) {
    try {
      console.log('Calling gRPC method GetAllStaffByStaffLeader with staffId:', staffId);
      const response = await lastValueFrom(
        this.userService.getAllStaffByStaffLeader({ staffId })
      );

      if (!response || !response.isSuccess) {
        console.log('Received error response from gRPC:', response);
        return {
          isSuccess: false,
          message: response?.message || 'Failed to retrieve staff members',
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      console.log('Received successful response from gRPC:', response);
      return response;
    } catch (error) {
      console.error('Error in getAllStaffByStaffLeader:', error);
      return {
        isSuccess: false,
        message: 'Service unavailable',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }
  }

  async getStaffLeaderByCrackReport(request: { crackReportId: string }) {
    try {
      console.log('Calling gRPC method GetStaffLeaderByCrackReport with crackReportId:', request.crackReportId);
      const response = await lastValueFrom(
        this.userService.getStaffLeaderByCrackReport(request)
      );

      if (!response || !response.isSuccess) {
        console.log('Received error response from gRPC:', response);
        return {
          isSuccess: false,
          message: response?.message || 'Failed to retrieve staff leaders',
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      console.log('Received successful response from gRPC for staff leaders');
      return response;
    } catch (error) {
      console.error('Error in getStaffLeaderByCrackReport:', error);
      return {
        isSuccess: false,
        message: 'Service unavailable',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }
  }

  // Public method to test getDepartment directly

}
