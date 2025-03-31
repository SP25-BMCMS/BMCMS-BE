import { Inject, Injectable } from '@nestjs/common';
import { USERS_CLIENT } from '../../constraints';
import { ClientGrpc } from '@nestjs/microservices';
import { UserInterface } from '../user/users.interface';
import { lastValueFrom } from 'rxjs';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';

@Injectable()
export class ResidentService {
  private userService: UserInterface;

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService');
  }

  async getAllResidents(paginationParams: PaginationParams) {
    const { page, limit } = paginationParams;
    console.log('API Gateway Service - Sending pagination parameters:', { page, limit });
    
    // Ensure we're sending numbers, not undefined
    const params = {
      page: typeof page === 'number' ? page : 1,
      limit: typeof limit === 'number' ? limit : 10
    };
    
    return await lastValueFrom(
      this.userService.GetAllResidents(params),
    );
  }

  async getResidentById(id: string) {
    return await lastValueFrom(this.userService.getResidentById({ id }));
  }

  async createResident(data: { username: string; password: string }) {
    return await lastValueFrom(this.userService.createResident(data));
  }

  async updateResident(
    id: string,
    data: { username: string; password: string },
  ) {
    return await lastValueFrom(this.userService.updateResident({ id, data }));
  }

  async deleteResident(id: string) {
    return await lastValueFrom(this.userService.deleteResident({ id }));
  }

  async getResidentByUsername(username: string) {
    return await lastValueFrom(
      this.userService.getResidentByUsername({ username }),
    );
  }

  async getResidentByEmail(email: string) {
    return await lastValueFrom(this.userService.getResidentByEmail({ email }));
  }

  async getResidentByPhone(phone: string) {
    return await lastValueFrom(this.userService.getResidentByPhone({ phone }));
  }

  async getApartmentsByResidentId(residentId: string) {
    return await lastValueFrom(
      this.userService.getApartmentsByResidentId({ residentId }),
    );
  }

  async getApartmentByResidentAndApartmentId(
    residentId: string,
    apartmentId: string,
  ) {
    return await lastValueFrom(
      this.userService.getApartmentByResidentAndApartmentId({
        residentId,
        apartmentId,
      }),
    );
  }
}
