import { createUserDto } from '@app/contracts/users/create-user.dto'
import { Observable } from 'rxjs'

export interface UserInterface {
  login(data: { username: string, password: string }): Observable<any>
  signup(userData: createUserDto): Observable<any>
  logout({ }): Observable<any>
  getUserInfo(data: { userId: string, username: string }): Observable<any>
  getAllUsers({ }): Observable<any>
  test(data: { username: string; password: string }): Observable<any>
  validateUser(data: { username: string, password: string }): Promise<any>

  //Resident
  getAllResidents({ }): Observable<any>
  getResidentById(data: { id: string }): Observable<any>
  createResident(data: { username: string, password: string }): Observable<any>
  updateResident(data: { id: string, data: { username: string, password: string } }): Observable<any>
  deleteResident(data: { id: string }): Observable<any>
  getResidentByUsername(data: { username: string }): Observable<any>
  getResidentByEmail(data: { email: string }): Observable<any>
  getResidentByPhone(data: { phone: string }): Observable<any>

}
