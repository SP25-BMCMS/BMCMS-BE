import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { USERS_CLIENT } from '../../constraints';
import { UserInterface } from '../user/users.interface';

@Injectable()
export class EmployeeService implements OnModuleInit {
  private userService: UserInterface;

  constructor(@Inject(USERS_CLIENT) private readonly client: ClientGrpc) { }

  onModuleInit() {
    this.userService = this.client.getService<UserInterface>('UserService');
  }

  async getAllStaff() {
    try {
      const response = await lastValueFrom(this.userService.getAllStaff({}));

      if (!response || !response.isSuccess) {
        return {
          isSuccess: false,
          message: response?.message || 'Failed to retrieve staff members',
          data: [],
        };
      }

      return response;
    } catch (error) {
      console.error('Error in getAllStaff:', error);
      return {
        isSuccess: false,
        message: 'Service unavailable',
        data: [],
      };
    }
  }

  async checkStaffAreaMatch(staffId: string, crackReportId: string) {
    try {
      const response = await lastValueFrom(
        this.userService.checkStaffAreaMatch({ staffId, crackReportId })
      );

      if (!response || !response.isSuccess) {
        return {
          isSuccess: false,
          message: response?.message || 'Failed to check area match',
          isMatch: false
        };
      }

      return response;
    } catch (error) {
      console.error('Error in checkStaffAreaMatch:', error);
      return {
        isSuccess: false,
        message: 'Service unavailable',
        isMatch: false
      };
    }
  }
}
