import { Inject, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { USERS_CLIENT } from '../../constraints';
import { ClientGrpc } from '@nestjs/microservices';
import { UserInterface } from '../user/users.interface';
import { lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';

interface SearchPaginationParams extends PaginationParams {
  search?: string;
}

@Injectable()
export class ResidentService {
  private userService: UserInterface;

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) { }

  onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService');
  }

  async getAllResidents(paginationParams: SearchPaginationParams) {
    const { page, limit, search } = paginationParams;

    // Ensure we're sending numbers, not undefined
    const params = {
      page: typeof page === 'number' ? page : 1,
      limit: typeof limit === 'number' ? limit : 10,
      search: search || ''
    };

    const response = await lastValueFrom(
      this.userService.getAllResidents(params),
    );


    return response;
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

  getApartmentsByResidentId(residentId: string) {
    return this.userService
      .getApartmentsByResidentId({ residentId })
      .pipe(
        map((response) => {

          // Check if response is empty or invalid
          if (!response) {
            throw new NotFoundException('No apartment data found');
          }

          // Check for success flags
          const isSuccessful = response.success || response.isSuccess;

          if (!isSuccessful) {
            throw new NotFoundException(response.message || 'Failed to retrieve apartments');
          }

          // Log data details for debugging

          if (response.data?.length > 0) {
            const firstItem = response.data[0];
            console.log(`First apartment data: ${JSON.stringify({
              hasApartmentId: !!firstItem.apartmentId,
              apartmentId: firstItem.apartmentId,
              apartmentName: firstItem.apartmentName
            })}`);
          }

          // Return exactly as received from the microservice
          return response;
        }),
        catchError((error) => {
          throw new InternalServerErrorException('Error retrieving apartments');
        }),
      );
  }

  getApartmentByResidentAndApartmentId(
    residentId: string,
    apartmentId: string,
  ) {
    console.log(`API Gateway - Getting apartment for resident ${residentId} and apartmentId ${apartmentId}`);
    return this.userService
      .getApartmentByResidentAndApartmentId({
        residentId,
        apartmentId,
      })
      .pipe(
        map((response) => {
          console.log('Raw apartment response:', JSON.stringify(response, null, 2));

          // Check if response is empty or invalid
          if (!response) {
            console.error('Empty response from microservice');
            throw new NotFoundException('No apartment data found');
          }

          // Check for success flags
          const isSuccessful = response.success || response.isSuccess;

          if (!isSuccessful) {
            console.error('Failed response from microservice:', response.message);
            throw new NotFoundException(response.message || 'Failed to retrieve apartment');
          }

          // Log apartment data details
          if (response.data) {
            console.log(`Found apartment: ${response.data.apartmentName}, has buildingDetails: ${!!response.data.buildingDetails}, warrantyDate: ${response.data.warrantyDate || 'none'}`);
          } else {
            console.log('No apartment data in response');
          }

          // Return exactly as received from the microservice
          return response;
        }),
        catchError((error) => {
          console.error('Error in getApartmentByResidentAndApartmentId:', error);
          throw new InternalServerErrorException('Error retrieving apartment');
        }),
      );
  }
}
