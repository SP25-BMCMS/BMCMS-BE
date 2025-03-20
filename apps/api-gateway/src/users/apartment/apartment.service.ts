import { Inject, Injectable } from "@nestjs/common"
import { USERS_CLIENT } from "../../constraints"
import { ClientGrpc } from "@nestjs/microservices"
import { UserInterface } from "../user/users.interface"
import { lastValueFrom } from "rxjs"

@Injectable()
export class ApartmentService {
  private userService: UserInterface

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) {
   }
   onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService');
  }
  //  async getApartmentById(apartmentId: string) {
  //   try {
  //     // Gọi microservice "Users" để lấy thông tin apartment
  //     const apartment = await lastValueFrom(
  //       this.userService.getApartmentById({ apartmentId })
  //     );
  //     return apartment;
  //   } catch (error) {
  //     throw new Error('Error occurred while fetching apartment');
  //   }
  // }
  async getApartmentById(apartmentId: string ) {
    console.log("🚀 ~ ApartmentService ~ getApartmentById ~ apartmentId:", apartmentId)
    try {
      // Gọi gRPC để lấy thông tin apartment từ microservice "Users"
      return await lastValueFrom(this.userService.getApartmentById({ apartmentId }))
    //  return apartment;
    } catch (error) {
      throw new Error('Error occurred while fetching apartment' + error.message);
    }
  }
  
}