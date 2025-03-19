import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ResidentDto } from '../../../libs/contracts/src/residents/resident.dto';
import { ClientProxy } from '@nestjs/microservices';
import { BUILDINGS_PATTERN } from '../../../libs/contracts/src/buildings/buildings.patterns';
import { firstValueFrom, catchError, timeout } from 'rxjs';

@Injectable()
export class ResidentsService {
  constructor(
    private prisma: PrismaService,
    @Inject('BUILDING_CLIENT') private readonly buildingClient: ClientProxy
  ) { }

  async getAllResidents() {
    try {
      // Get all users with Resident role
      const residents = await this.prisma.user.findMany({
        where: {
          role: 'Resident'
        },
        select: {
          userId: true,
          username: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          userDetails: true,
          apartments: true
        }
      });

      // For each resident, get building details for each apartment
      const residentsWithBuildingDetails = await Promise.all(
        residents.map(async (resident) => {
          const apartmentsWithBuildings = await Promise.all(
            resident.apartments.map(async (apartment) => {
              try {
                // Get building details from building service
                const buildingResponse = await firstValueFrom(
                  this.buildingClient.send(
                    BUILDINGS_PATTERN.GET_BY_ID,
                    { buildingId: apartment.buildingId }
                  ).pipe(
                    timeout(5000),
                    catchError(err => {
                      console.error(`Error fetching building ${apartment.buildingId}:`, err);
                      return [];
                    })
                  )
                );

                // Return apartment with building details
                return {
                  ...apartment,
                  building: buildingResponse.statusCode === 200 ? buildingResponse.data : null
                };
              } catch (error) {
                console.error(`Failed to get building for apartment ${apartment.apartmentName}:`, error);
                return {
                  ...apartment,
                  building: null
                };
              }
            })
          );

          // Return resident with enhanced apartment data
          return {
            ...resident,
            apartments: apartmentsWithBuildings
          };
        })
      );

      return { success: true, data: residentsWithBuildingDetails };
    } catch (error) {
      console.error('Error in getAllResidents:', error);
      return { success: false, message: error.message };
    }
  }

  async getApartmentsByResidentId(residentId: string) {
    try {
      const apartments = await this.prisma.apartment.findMany({
        where: {
          ownerId: residentId
        }
      });

      // Lấy thông tin building cho mỗi căn hộ
      const apartmentsWithBuildings = await Promise.all(
        apartments.map(async (apartment) => {
          try {
            // Lấy thông tin building từ building service
            const buildingResponse = await firstValueFrom(
              this.buildingClient.send(
                BUILDINGS_PATTERN.GET_BY_ID,
                { buildingId: apartment.buildingId }
              ).pipe(
                timeout(5000),
                catchError(err => {
                  console.error(`Error fetching building ${apartment.buildingId}:`, err);
                  return [];
                })
              )
            );

            // Trả về căn hộ với thông tin building
            return {
              ...apartment,
              building: buildingResponse.statusCode === 200 ? buildingResponse.data : null
            };
          } catch (error) {
            console.error(`Failed to get building for apartment ${apartment.apartmentName}:`, error);
            return {
              ...apartment,
              building: null
            };
          }
        })
      );

      return { success: true, data: apartmentsWithBuildings };
    } catch (error) {
      console.error('Error in getApartmentsByResidentId:', error);
      return { success: false, message: error.message };
    }
  }
}
