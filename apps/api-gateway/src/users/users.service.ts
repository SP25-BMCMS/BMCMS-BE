import { UserDto } from '@app/contracts/users/user.dto'
import { USERS_PATTERN } from '@app/contracts/users/users.patterns'
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { catchError, firstValueFrom } from 'rxjs'
import { USERS_CLIENT } from '../constraints'

@Injectable()
export class UsersService {
  constructor(@Inject(USERS_CLIENT) private usersClient: ClientProxy) { }

  async login(username: string, password: string) {
    const user = await this.usersClient.send(USERS_PATTERN.LOGIN, { username, password })
    return user
  }
  async signup(userData) {
    try {
      return await firstValueFrom(
        this.usersClient.send(USERS_PATTERN.SIGNUP, userData).pipe(
          catchError((error) => {
            throw new HttpException(error.response?.message || 'Internal Server Error', error.response?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR)
          }),
        ),
      )
    } catch (error) {
      throw new HttpException(error.message, error.getStatus())
    }
  }

  async getUserInfo(user: UserDto) {
    return this.usersClient.send(USERS_PATTERN.ME, user)
  }

  async getAllUsers() {
    const users = await this.usersClient.send(USERS_PATTERN.ALL_USERS, {})
    return users
  }

  async logout() {
    return this.usersClient.send(USERS_PATTERN.LOGOUT, {})
  }

  async test(data: any) {
    try {
      const response = await this.usersClient.send(USERS_PATTERN.TEST, data)
      return response
    } catch (error) {
      throw error
    }
  }
}
