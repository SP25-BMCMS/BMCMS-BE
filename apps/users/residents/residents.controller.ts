import { Controller } from '@nestjs/common'
import { ResidentsService } from './residents.service'
import { GrpcMethod } from '@nestjs/microservices'

@Controller()
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) { }

  @GrpcMethod('UserService', 'getAllResidents')
  async getAllResidents() {
    return this.residentsService.getAllResidents();
  }

  @GrpcMethod('UserService', 'getApartmentsByResidentId')
  async getApartmentsByResidentId(data: { residentId: string }) {
    return this.residentsService.getApartmentsByResidentId(data.residentId);
  }
}
