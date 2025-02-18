import { handleGrpcError } from '@app/contracts/helper/grpc-error-handler'
import { createUserDto } from '@app/contracts/users/create-user.dto'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs'
import { USERS_CLIENT } from '../../constraints'
import { UserInterface } from './users.interface'

@Injectable()
export class UsersService implements OnModuleInit {
  private userService: UserInterface

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) { }

  onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService')
  }

  async login(data: { username: string, password: string }) {
    return await lastValueFrom(this.userService.login(data))
  }

  async signup(userData: createUserDto) {
    try {
      const result = await lastValueFrom(this.userService.signup(userData))
      return result
    } catch (err) {
      handleGrpcError(err)
    }
  }

  async logout() {
    return await lastValueFrom(this.userService.logout({}))
  }

  async getUserInfo(data: { userId: string, username: string }) {
    return await lastValueFrom(this.userService.getUserInfo(data))
  }

  async getAllUsers() {
    return await lastValueFrom(this.userService.getAllUsers({}))
  }


  async test(data: { username: string; password: string }) {
    return await lastValueFrom(this.userService.test(data))
  }

}
