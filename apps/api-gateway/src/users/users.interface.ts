import { createUserDto } from '@app/contracts/users/create-user.dto'
import { Observable } from 'rxjs'

export interface UserInterface {
  login(data: { username: string, password: string }): Observable<any>
  signup(userData: createUserDto): Observable<any>
  logout(): Observable<any>
  getUserInfo(data: { userId: string, username: string }): Observable<any>
  getAllUsers(): Observable<any>
  test(data: { username: string; password: string }): Observable<any>
  validateUser(data: { username: string, password: string }): Promise<any>
}
