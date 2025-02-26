import { Observable } from 'rxjs';
import { createUserDto } from '../../../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../../../libs/contracts/src/ApiReponse/api-response';

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
}
