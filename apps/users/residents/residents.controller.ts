import { Controller } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @GrpcMethod('UserService', 'GetAllResidents')
  async getAllResidents(data: { page?: number; limit?: number }) {
    console.log("Received in microservice - raw data:", data);
    
    // Ensure data is not null or undefined
    const params = data || {};
    
    // Always use explicit number values, defaulting to 1 and 10 if not provided
    const page = typeof params.page === 'number' ? params.page : 1;
    const limit = typeof params.limit === 'number' ? params.limit : 10;
    
    console.log("Microservice residents controller - Using values - page:", page, "limit:", limit);
    
    return this.residentsService.getAllResidents({ page, limit });
  }

  @GrpcMethod('UserService', 'getApartmentsByResidentId')
  async getApartmentsByResidentId(data: { residentId: string }) {
    return this.residentsService.getApartmentsByResidentId(data.residentId);
  }
}
