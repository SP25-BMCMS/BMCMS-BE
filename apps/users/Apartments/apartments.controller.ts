import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApartmentsService } from './apartments.service';
import { GrpcMethod, MessagePattern } from '@nestjs/microservices';
import { APARTMENTS_PATTERN } from '@app/contracts/Apartments/Apartments.patterns';
@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly apartments: ApartmentsService) {}

  @GrpcMethod('UserService', 'GetApartmentById')
  async getApartmentById(data: { apartmentId: string }) {
    const { apartmentId } = data;
    console.log("🚀 ~ Apartment1231231312312sController ~ getApartmentById ~ data:", data)

    return this.apartments.getApartmentById(apartmentId);
  }

  @MessagePattern('get_apartment_by_id')
  async getApartmentByIdRmq(data: { apartmentId: string }) {
    const { apartmentId } = data;
    console.log("🚀 ~ ApartmentsController ~ getApartmentByIdRmq ~ apartmentId:", apartmentId);
    
    return this.apartments.getApartmentById(apartmentId);
  }
}
