import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ResidentDto } from '../../../libs/contracts/src/residents/resident.dto';
import { ClientProxy } from '@nestjs/microservices';
import { BUILDINGS_PATTERN } from '../../../libs/contracts/src/buildings/buildings.patterns';
import { BUILDINGDETAIL_PATTERN } from '../../../libs/contracts/src/BuildingDetails/buildingdetails.patterns';
import { AREAS_PATTERN } from '../../../libs/contracts/src/Areas/Areas.patterns';
import { firstValueFrom, catchError, timeout, of, retry, from } from 'rxjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResidentsService {
  constructor(
    private prisma: PrismaService,
    @Inject('BUILDING_CLIENT') private readonly buildingClient: ClientProxy
  ) { }

  private async getBuildingDetails(buildingId: string) {
    try {
      const response = await firstValueFrom(
        this.buildingClient.send(
          BUILDINGS_PATTERN.GET_BY_ID,
          { buildingId }
        ).pipe(
          timeout(5000),
          retry(2), // Retry 2 times before giving up
          catchError(err => {
            console.error(`Error fetching building ${buildingId} after retries:`, err);
            return of({
              statusCode: 404,
              data: null
            });
          })
        )
      );
      return response;
    } catch (error) {
      console.error(`Failed to get building ${buildingId}:`, error);
      return {
        statusCode: 404,
        data: null
      };
    }
  }

  private async getAreaDetails(areaId: string) {
    try {
      const response = await firstValueFrom(
        this.buildingClient.send(
          AREAS_PATTERN.GET_BY_ID,
          { areaId }
        ).pipe(
          timeout(5000),
          retry(2), // Retry 2 times before giving up
          catchError(err => {
            console.error(`Error fetching area ${areaId} after retries:`, err);
            return of({
              statusCode: 404,
              data: null
            });
          })
        )
      );
      return response;
    } catch (error) {
      console.error(`Failed to get area ${areaId}:`, error);
      return {
        statusCode: 404,
        data: null
      };
    }
  }

  async getAllResidents(paginationParams?: { page?: number; limit?: number }) {
    try {
      const { page = 1, limit = 10 } = paginationParams || {};
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await this.prisma.user.count({
        where: {
          role: 'Resident'
        }
      });

      // Get all users with Resident role with pagination
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
          apartments: true,
          accountStatus: true,
          role: true
        },
        skip,
        take: limit
      });

      // Process residents in parallel with better error handling
      const residentsWithBuildingDetails = await Promise.all(
        residents.map(async (resident) => {
          // Process all apartments for a resident in parallel
          const apartmentPromises = resident.apartments.map(async (apartment) => {
            const buildingResponse = await this.getBuildingDetails(apartment.buildingId);

            return {
              apartmentName: apartment.apartmentName,
              buildingId: apartment.buildingId,
              building: buildingResponse?.statusCode === 200 ? buildingResponse.data : null
            };
          });

          // Wait for all apartment details to be fetched
          const apartmentsWithBuildings = await Promise.all(apartmentPromises);

          return {
            userId: resident.userId,
            username: resident.username,
            email: resident.email,
            phone: resident.phone,
            role: resident.role,
            dateOfBirth: resident.dateOfBirth ? resident.dateOfBirth.toISOString() : null,
            gender: resident.gender,
            accountStatus: resident.accountStatus,
            userDetails: resident.userDetails,
            apartments: apartmentsWithBuildings
          };
        })
      );

      return {
        isSuccess: true,
        message: 'Danh sách cư dân',
        data: residentsWithBuildingDetails,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Error in getAllResidents:', error);
      return {
        isSuccess: false,
        message: error.message || 'Lỗi khi lấy danh sách cư dân',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }
  }

  async getApartmentsByResidentId(residentId: string) {
    try {
      console.log('Getting apartments for resident:', residentId);
      const apartments = await this.prisma.apartment.findMany({
        where: {
          ownerId: residentId
        }
      });
      console.log('Found apartments:', apartments);

      if (!apartments || apartments.length === 0) {
        return {
          isSuccess: false,
          message: "Resident not found",
          statusCode: 404,
          data: []
        };
      }

      // Process apartments with building and area details
      const apartmentsWithDetails = await Promise.all(
        apartments.map(async (apartment) => {
          try {
            console.log('Processing apartment:', apartment.apartmentName);

            // Get building details from building service
            const buildingResponse = await firstValueFrom(
              this.buildingClient.send(
                BUILDINGS_PATTERN.GET_BY_ID,
                { buildingId: apartment.buildingId }
              ).pipe(
                timeout(5000),
                retry(2),
                catchError(err => {
                  console.error(`Error fetching building ${apartment.buildingId} after retries:`, err);
                  return of({
                    statusCode: 404,
                    data: null
                  });
                })
              )
            );

            let areaInfo = null;
            if (buildingResponse?.statusCode === 200 && buildingResponse.data?.areaId) {
              console.log('Found areaId in building:', buildingResponse.data.areaId);
              const areaResponse = await this.getAreaDetails(buildingResponse.data.areaId);
              console.log('Area response:', areaResponse);
              if (areaResponse?.statusCode === 200) {
                areaInfo = areaResponse.data;
                console.log('Successfully got area info:', areaInfo);
              } else {
                console.log('Failed to get area info, status:', areaResponse?.statusCode);
              }
            } else {
              console.log('No areaId found in building');
            }

            // Get building details
            let buildingDetails = [];
            if (buildingResponse?.statusCode === 200) {
              console.log('Fetching building details for building:', apartment.buildingId);
              const buildingDetailsResponse = await firstValueFrom(
                this.buildingClient.send(
                  BUILDINGDETAIL_PATTERN.GET_BY_ID,
                  { buildingId: apartment.buildingId }
                ).pipe(
                  timeout(5000),
                  retry(2),
                  catchError(err => {
                    console.error(`Error fetching building details for ${apartment.buildingId} after retries:`, err);
                    return of({
                      statusCode: 404,
                      data: []
                    });
                  })
                )
              );

              console.log('Raw building details response:', JSON.stringify(buildingDetailsResponse, null, 2));

              if (buildingDetailsResponse?.statusCode === 200) {
                // Handle both single object and array responses
                buildingDetails = Array.isArray(buildingDetailsResponse.data)
                  ? buildingDetailsResponse.data
                  : [buildingDetailsResponse.data];
                console.log('Successfully got building details:', JSON.stringify(buildingDetails, null, 2));
              } else {
                console.log('Failed to get building details, status:', buildingDetailsResponse?.statusCode);
                console.log('Error message:', buildingDetailsResponse?.message);
              }
            }

            const response = {
              apartmentName: apartment.apartmentName,
              apartmentId: apartment.apartmentId,
              building: buildingResponse?.statusCode === 200 ? {
                ...buildingResponse.data,
                area: areaInfo,
                buildingDetails: buildingDetails
              } : null
            };
            console.log('Final apartment response:', JSON.stringify(response, null, 2));
            return response;
          } catch (error) {
            console.error(`Failed to process apartment ${apartment.apartmentName}:`, error);
            return {
              apartmentName: apartment.apartmentName,
              apartmentId: apartment.apartmentId,
              building: null
            };
          }
        })
      );

      return {
        isSuccess: true,
        message: "Success",
        statusCode: 200,
        data: apartmentsWithDetails
      };
    } catch (error) {
      console.error('Error in getApartmentsByResidentId:', error);
      return {
        isSuccess: false,
        message: error.message,
        statusCode: 500,
        data: []
      };
    }
  }

}
