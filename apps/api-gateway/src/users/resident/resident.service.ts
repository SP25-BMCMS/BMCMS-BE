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

  async getResidentById(id: string) {
    return await lastValueFrom(this.userService.getResidentById({ id }))
  }

  async createResident(data: { username: string, password: string }) {
    return await lastValueFrom(this.userService.createResident(data))
  }

  async updateResident(id: string, data: { username: string, password: string }) {
    return await lastValueFrom(this.userService.updateResident({ id, data }))
  }

  async deleteResident(id: string) {
    return await lastValueFrom(this.userService.deleteResident({ id }))
  }

  async getResidentByUsername(username: string) {
    return await lastValueFrom(this.userService.getResidentByUsername({ username }))
  }

  async getResidentByEmail(email: string) {
    return await lastValueFrom(this.userService.getResidentByEmail({ email }))
  }

  async getResidentByPhone(phone: string) {
    return await lastValueFrom(this.userService.getResidentByPhone({ phone }))
  }

}