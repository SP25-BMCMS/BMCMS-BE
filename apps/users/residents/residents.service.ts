import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResidentDto } from '../../../libs/contracts/src/residents/resident.dto';
import { ClientProxy } from '@nestjs/microservices';
import { BUILDINGS_PATTERN } from '../../../libs/contracts/src/buildings/buildings.patterns';
import { firstValueFrom, catchError, timeout, of, retry, from } from 'rxjs';

@Injectable()
export class ResidentsService {
  constructor(
    private prisma: PrismaService,
    @Inject('BUILDING_CLIENT') private readonly buildingClient: ClientProxy,
  ) {}

  private async getBuildingDetails(buildingId: string) {
    try {
      const response = await firstValueFrom(
        this.buildingClient
          .send(BUILDINGS_PATTERN.GET_BY_ID, { buildingId })
          .pipe(
            timeout(5000),
            retry(2), // Retry 2 times before giving up
            catchError((err) => {
              console.error(
                `Error fetching building ${buildingId} after retries:`,
                err,
              );
              return of({
                statusCode: 404,
                data: null,
              });
            }),
          ),
      );
      return response;
    } catch (error) {
      console.error(`Failed to get building ${buildingId}:`, error);
      return {
        statusCode: 404,
        data: null,
      };
    }
  }

  async getAllResidents() {
    try {
      // Get all users with Resident role
      const residents = await this.prisma.user.findMany({
        where: {
          role: 'Resident',
        },
        select: {
          userId: true,
          username: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          userDetails: true,
          apartments: true,
          accountStatus: true,
          role: true,
        },
      });

      // Process residents in parallel with better error handling
      const residentsWithBuildingDetails = await Promise.all(
        residents.map(async (resident) => {
          // Process all apartments for a resident in parallel
          const apartmentPromises = resident.apartments.map(
            async (apartment) => {
              const buildingResponse = await this.getBuildingDetails(
                apartment.buildingId,
              );

              return {
                apartmentName: apartment.apartmentName,
                buildingId: apartment.buildingId,
                building:
                  buildingResponse?.statusCode === 200
                    ? buildingResponse.data
                    : null,
              };
            },
          );

          // Wait for all apartment details to be fetched
          const apartmentsWithBuildings = await Promise.all(apartmentPromises);

          return {
            userId: resident.userId,
            username: resident.username,
            email: resident.email,
            phone: resident.phone,
            role: resident.role,
            dateOfBirth: resident.dateOfBirth
              ? resident.dateOfBirth.toISOString()
              : null,
            gender: resident.gender,
            accountStatus: resident.accountStatus,
            userDetails: resident.userDetails,
            apartments: apartmentsWithBuildings,
          };
        }),
      );

      return {
        isSuccess: true,
        message: 'Danh sách cư dân',
        data: residentsWithBuildingDetails,
      };
    } catch (error) {
      console.error('Error in getAllResidents:', error);
      return {
        isSuccess: false,
        message: error.message || 'Lỗi khi lấy danh sách cư dân',
        data: [],
      };
    }
  }

  async getApartmentsByResidentId(residentId: string) {
    try {
      const apartments = await this.prisma.apartment.findMany({
        where: {
          ownerId: residentId,
        },
      });

      // Lấy thông tin building cho mỗi căn hộ
      const apartmentsWithBuildings = await Promise.all(
        apartments.map(async (apartment) => {
          try {
            // Lấy thông tin building từ building service
            const buildingResponse = await firstValueFrom(
              this.buildingClient
                .send(BUILDINGS_PATTERN.GET_BY_ID, {
                  buildingId: apartment.buildingId,
                })
                .pipe(
                  timeout(5000),
                  catchError((err) => {
                    console.error(
                      `Error fetching building ${apartment.buildingId}:`,
                      err,
                    );
                    return [];
                  }),
                ),
            );

            // Trả về căn hộ với thông tin building
            return {
              ...apartment,
              building:
                buildingResponse.statusCode === 200
                  ? buildingResponse.data
                  : null,
            };
          } catch (error) {
            console.error(
              `Failed to get building for apartment ${apartment.apartmentName}:`,
              error,
            );
            return {
              ...apartment,
              building: null,
            };
          }
        }),
      );

      return { success: true, data: apartmentsWithBuildings };
    } catch (error) {
      console.error('Error in getApartmentsByResidentId:', error);
      return { success: false, message: error.message };
    }
  }
}
