import { Observable } from 'rxjs';
import { createUserDto } from '../../../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../../../libs/contracts/src/ApiReponse/api-response';
import { CreateWorkingPositionDto } from '../../../../../libs/contracts/src/users/create-working-position.dto';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';
import { UpdateAccountStatusDto } from '../../../../../libs/contracts/src/users/update-account-status.dto';

export interface UserInterface {
  login(data: { username: string, password: string }): Observable<any>;
  signup(userData: createUserDto): Observable<ApiResponse<any>>; // ✅ Sửa kiểu trả về
  logout({ }): Observable<any>;
  getUserInfo(data: { userId: string, username: string }): Observable<any>;
  getAllUsers({ }): Observable<any>;
  test(data: { username: string; password: string }): Observable<any>;
  validateUser(data: { username: string, password: string }): Promise<any>;

  // Resident
  getAllResidents({ }): Observable<any>;
  getResidentById(data: { id: string }): Observable<any>;
  createResident(data: { username: string, password: string }): Observable<any>;
  updateResident(data: { id: string, data: { username: string, password: string } }): Observable<any>;
  deleteResident(data: { id: string }): Observable<any>;
  getResidentByUsername(data: { username: string }): Observable<any>;
  getResidentByEmail(data: { email: string }): Observable<any>;
  getResidentByPhone(data: { phone: string }): Observable<any>;

  // Staff/Employee Methods
  getAllStaff({ }): Observable<any>;

  // Working Position Methods
  createWorkingPosition(data: CreateWorkingPositionDto): Observable<any>;
  getAllWorkingPositions({ }): Observable<any>;
  getWorkingPositionById(data: { positionId: string }): Observable<any>;
  deleteWorkingPosition(data: { positionId: string }): Observable<any>;

  // Department Methods
  createDepartment(data: CreateDepartmentDto): Observable<any>;

  // Apartments Methods
  getApartmentsByResidentId(data: { residentId: string }): Observable<any>;

  // Resident Authentication
  residentLogin(data: { phone: string, password: string }): Observable<any>;
  verifyOtpAndCompleteSignup(data: { phone: string; otp: string; userData: createUserDto }): Observable<any>;
  verifyOtpAndLogin(data: { phone: string, otp: string }): Observable<any>;

  updateResidentApartments(data: { residentId: string; apartments: { apartmentName: string; buildingId: string }[] }): Observable<any>;

  // Account Status
  updateAccountStatus(data: { userId: string, accountStatus: string }): Observable<any>;

}
