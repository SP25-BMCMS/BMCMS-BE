import { Inject, Injectable } from "@nestjs/common"
import { USERS_CLIENT } from "../../constraints"
import { ClientGrpc } from "@nestjs/microservices"
import { UserInterface } from "../user/users.interface"
import { lastValueFrom } from "rxjs"

@Injectable()
export class ResidentService {
  private userService: UserInterface

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) { }

  onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService')
  }

  async getAllResidents() {
    return await lastValueFrom(this.userService.getAllResidents({}))
  }
}