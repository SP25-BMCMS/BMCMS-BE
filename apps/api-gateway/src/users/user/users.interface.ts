import { Observable } from 'rxjs';
import { createUserDto } from '../../../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../../../libs/contracts/src/ApiResponse/api-response';
import { CreateWorkingPositionDto } from '../../../../../libs/contracts/src/users/create-working-position.dto';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';
import { UpdateAccountStatusDto } from '../../../../../libs/contracts/src/users/update-account-status.dto';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';

export interface UserInterface {
  login(data: { username: string; password: string }): Observable<any>
  signup(userData: createUserDto): Observable<ApiResponse<any>> // ✅ Sửa kiểu trả về
  logout({ }): Observable<any>
  getUserInfo(data: { userId: string; username: string }): Observable<any>
  getUserById(data: { userId: string }): Observable<{
    isSuccess: boolean
    message: string
    data: {
      username: string
    }
  }>
  GetUserByIdForTaskAssignmentDetail(data: { userId: string }): Observable<{
    isSuccess: boolean;
    message: string;
    data: {
      userId: string;
      username: string;
    };
  }>;
  getAllUsers({ }): Observable<any>
  test(data: { username: string; password: string }): Observable<any>
  validateUser(data: { username: string; password: string }): Promise<any>

  // Resident
  getAllResidents(paginationParams: { page?: number; limit?: number; search?: string }): Observable<any>
  getResidentById(data: { id: string }): Observable<any>
  createResident(data: { username: string; password: string }): Observable<any>
  updateResident(data: {
    id: string
    data: { username: string; password: string }
  }): Observable<any>
  deleteResident(data: { id: string }): Observable<any>
  getResidentByUsername(data: { username: string }): Observable<any>
  getResidentByEmail(data: { email: string }): Observable<any>
  getResidentByPhone(data: { phone: string }): Observable<any>

  // Staff/Employee Methods
  getAllStaff(paginationParams?: { page?: number; limit?: number; search?: string; role?: string | string[] }): Observable<any>
  updateDepartmentAndWorkingPosition(data: {
    staffId: string
    departmentId: string
    positionId: string
  }): Observable<any>

  // Working Position Methods
  createWorkingPosition(data: CreateWorkingPositionDto): Observable<any>
  getAllWorkingPositions({ }): Observable<any>
  getWorkingPositionById(data: { positionId: string }): Observable<any>
  deleteWorkingPosition(data: { positionId: string }): Observable<any>

  // Department Methods
  createDepartment(data: CreateDepartmentDto): Observable<any>
  getDepartmentById(data: { departmentId: string }): Observable<any>
  getAllDepartments(data: {}): Observable<any>

  // Apartments Methods
  getApartmentsByResidentId(data: { residentId: string }): Observable<{
    isSuccess?: boolean
    success?: boolean
    message: string
    data: any[] // Mảng các user response
  }>
  getApartmentByResidentAndApartmentId(data: {
    residentId: string
    apartmentId: string
  }): Observable<any>

  // Resident Authentication
  residentLogin(data: { phone: string; password: string }): Observable<any>
  verifyOtpAndCompleteSignup(data: {
    email: string
    otp: string
    userData: createUserDto
  }): Observable<any>

  updateResidentApartments(data: {
    residentId: string
    apartments: {
      apartmentName: string;
      buildingDetailId: string;
    }[]
  }): Observable<any>

  // Account Status
  updateAccountStatus(data: {
    userId: string
    accountStatus: string
  }): Observable<any>
  getApartmentById(data: { apartmentId: string }): Observable<any>

  checkStaffAreaMatch(data: { staffId: string; crackReportId: string }): Observable<any>;

  getAllStaffByStaffLeader(request: { staffId: string }): Observable<{
    isSuccess: boolean;
    message: string;
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  checkStaffAreaMatchWithScheduleJob(data: { staffId: string; scheduleJobId: string }): Observable<{
    isSuccess: boolean;
    message: string;
    isMatch: boolean;
  }>;

  // User role validation
  checkUserExists(data: { userId: string; role?: string }): Observable<{
    exists: boolean;
    message: string;
    data?: { userId: string; role: string } | null;
  }>;

  getStaffLeaderByCrackReport(data: { crackReportId: string }): Observable<{
    isSuccess: boolean;
    message: string;
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  getStaffLeaderByScheduleJob(data: { scheduleJobId: string }): Observable<{
    isSuccess: boolean;
    message: string;
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  getAllStaffByDepartmentType(data: { staffId: string; departmentType: string }): Observable<{
    isSuccess: boolean;
    message: string;
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
}
