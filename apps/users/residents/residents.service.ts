import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ResidentDto } from '../../../libs/contracts/src/residents/resident.dto'
import { ClientProxy } from '@nestjs/microservices'
import { BUILDINGS_PATTERN } from '../../../libs/contracts/src/buildings/buildings.patterns'
import { BUILDINGDETAIL_PATTERN } from '../../../libs/contracts/src/BuildingDetails/buildingdetails.patterns'
import { firstValueFrom, catchError, timeout, of, retry, from } from 'rxjs'
import { Prisma } from '@prisma/client'
import { AREAS_PATTERN } from '../../../libs/contracts/src/Areas/Areas.patterns'

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
            console.error(`Error fetching building ${buildingId} after retries:`, err)
            return of({
              statusCode: 404,
              data: null
            })
          })
        )
      )
      return response
    } catch (error) {
      console.error(`Failed to get building ${buildingId}:`, error)
      return {
        statusCode: 404,
        data: null
      }
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
            console.error(`Error fetching area ${areaId} after retries:`, err)
            return of({
              statusCode: 404,
              data: null
            })
          })
        )
      )
      return response
    } catch (error) {
      console.error(`Failed to get area ${areaId}:`, error)
      return {
        statusCode: 404,
        data: null
      }
    }
  }

  async getAllResidents(paginationParams?: { page?: number; limit?: number; search?: string }) {
    try {
      const { page = 1, limit = 10, search = '' } = paginationParams || {}
      const skip = (page - 1) * limit

      console.log(`Service - Getting residents with params - page: ${page}, limit: ${limit}, search: ${search || 'none'}, skip: ${skip}`)

      // Tạo điều kiện tìm kiếm
      const whereCondition: any = {
        role: 'Resident'
      }

      // Nếu có từ khóa tìm kiếm
      if (search && search.trim()) {
        whereCondition.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Get total count for pagination with search filter
      const totalCount = await this.prisma.user.count({
        where: whereCondition
      })

      const totalPages = Math.ceil(totalCount / limit)

      // Get all users with Resident role with pagination and search
      const residents = await this.prisma.user.findMany({
        where: whereCondition,
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
      })

      console.log('Found residents:', residents.length)

      // Process residents in parallel with better error handling
      const residentsWithBuildingDetails = await Promise.all(
        residents.map(async (resident) => {
          // Process all apartments for a resident in parallel
          const apartmentPromises = resident.apartments.map(async (apartment) => {
            console.log(`Processing apartment ${apartment.apartmentName} with buildingDetailId ${apartment.buildingDetailId}`)

            try {
              // Get building detail information
              const buildingDetailResponse = await firstValueFrom(
                this.buildingClient.send(
                  BUILDINGDETAIL_PATTERN.GET_BY_ID,
                  { buildingDetailId: apartment.buildingDetailId }
                ).pipe(
                  timeout(5000),
                  retry(2),
                  catchError(err => {
                    console.error(`Error fetching building detail ${apartment.buildingDetailId}:`, err)
                    return of({ statusCode: 404, data: null })
                  })
                )
              )

              console.log(`Building detail response for ${apartment.buildingDetailId}:`,
                buildingDetailResponse?.statusCode,
                buildingDetailResponse?.data?.building ? 'Has building' : 'No building',
                buildingDetailResponse?.data?.building?.buildingId ? 'Has buildingId' : 'No buildingId'
              )

              // Lấy thông tin buildingDetail từ response
              const buildingDetail = buildingDetailResponse?.statusCode === 200 ?
                buildingDetailResponse.data : null

              // Format response theo đúng cấu trúc proto
              return {
                apartmentId: apartment.apartmentId,
                apartmentName: apartment.apartmentName,
                buildingDetails: buildingDetail ? {
                  buildingDetailId: buildingDetail.buildingDetailId,
                  name: buildingDetail.name,
                  total_apartments: buildingDetail.total_apartments || 0,
                  building: buildingDetail.building || null // Đã có thông tin building và area từ buildingDetail
                } : null
              }
            } catch (error) {
              console.error(`Error processing apartment ${apartment.apartmentName}:`, error)
              return {
                apartmentName: apartment.apartmentName,
                buildingDetails: null
              }
            }
          })

          // Wait for all apartment details to be fetched
          const apartmentsWithBuildings = await Promise.all(apartmentPromises)

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
          }
        })
      )

      const paginationData = {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: totalPages
      }


      return {
        isSuccess: true,
        message: 'Danh sách cư dân',
        data: residentsWithBuildingDetails,
        pagination: paginationData
      }
    } catch (error) {
      console.error('Error in getAllResidents:', error)
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
      }
    }
  }

  async getApartmentsByResidentId(residentId: string) {
    try {
      // Get user information first with explicit fields according to proto
      const resident = await this.prisma.user.findUnique({
        where: { userId: residentId },
        select: {
          userId: true,
          username: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          accountStatus: true,
          role: true,
          userDetails: true
        }
      })

      if (!resident) {
        return {
          isSuccess: false,
          success: false,
          message: "Resident not found",
          data: []
        }
      }


      // Get apartments for this resident
      const apartments = await this.prisma.apartment.findMany({
        where: {
          ownerId: residentId
        }
      })

      // Return apartments directly instead of wrapping in user object
      if (apartments.length === 0) {
        return {
          isSuccess: true,
          success: true,
          message: "No apartments found",
          data: []
        }
      }

      // Process apartments with building details
      const processedApartments = await Promise.all(
        apartments.map(async (apartment) => {
          try {
            // Get building detail information
            const buildingDetailResponse = apartment.buildingDetailId ? await firstValueFrom(
              this.buildingClient.send(
                BUILDINGDETAIL_PATTERN.GET_BY_ID,
                { buildingDetailId: apartment.buildingDetailId }
              ).pipe(
                timeout(5000),
                retry(2),
                catchError(err => {
                  return of({ statusCode: 404, data: null })
                })
              )
            ) : { statusCode: 404, data: null }
            // Get buildingDetail information
            const buildingDetail = buildingDetailResponse?.statusCode === 200 ?
              buildingDetailResponse.data : null

            // Explicit apartment response object
            return {
              apartmentId: apartment.apartmentId,
              apartmentName: apartment.apartmentName,
              buildingDetails: buildingDetail ? {
                buildingDetailId: buildingDetail.buildingDetailId || '',
                name: buildingDetail.name || '',
                total_apartments: buildingDetail.total_apartments || 0,
                building: buildingDetail.building ? {
                  buildingId: buildingDetail.building.buildingId || '',
                  name: buildingDetail.building.name || '',
                  description: buildingDetail.building.description || '',
                  numberFloor: buildingDetail.building.numberFloor || 0,
                  imageCover: buildingDetail.building.imageCover || '',
                  areaId: buildingDetail.building.areaId || '',
                  Status: buildingDetail.building.Status || '',
                  construction_date: buildingDetail.building.construction_date || '',
                  completion_date: buildingDetail.building.completion_date || '',
                  area: buildingDetail.building.area || null
                } : null
              } : null
            }
          } catch (error) {
            return {
              apartmentId: apartment.apartmentId || '',
              apartmentName: apartment.apartmentName || '',
              buildingDetails: null
            }
          }
        })
      )

      // Return in the format expected by GetApartmentByResidentIdResponse proto
      return {
        isSuccess: true,
        success: true,
        message: "Success",
        data: processedApartments
      }
    } catch (error) {
      return {
        isSuccess: false,
        success: false,
        message: error.message || 'Unknown error',
        data: []
      }
    }
  }

  async getApartmentByResidentAndApartmentId(residentId: string, apartmentId: string) {
    try {
      console.log(`Getting apartment for resident ${residentId} and apartment ${apartmentId}`)

      // Get user information first
      const resident = await this.prisma.user.findUnique({
        where: { userId: residentId },
        select: {
          userId: true,
          username: true,
          email: true,
          phone: true,
          role: true
        }
      })

      if (!resident) {
        console.log(`Resident with ID ${residentId} not found`)
        return {
          isSuccess: false,
          success: false,
          message: "Resident not found",
          data: null
        }
      }

      // Find the specific apartment
      const apartment = await this.prisma.apartment.findFirst({
        where: {
          apartmentId: apartmentId,
          ownerId: residentId
        }
      })

      if (!apartment) {
        console.log(`Apartment with ID ${apartmentId} not found for resident ${residentId}`)
        return {
          isSuccess: false,
          success: false,
          message: "Apartment not found",
          data: null
        }
      }

      console.log(`Found apartment: ${apartment.apartmentName}`)

      // Get building detail information
      let buildingDetail = null

      if (apartment.buildingDetailId) {
        const buildingDetailResponse = await firstValueFrom(
          this.buildingClient.send(
            BUILDINGDETAIL_PATTERN.GET_BY_ID,
            { buildingDetailId: apartment.buildingDetailId }
          ).pipe(
            timeout(5000),
            retry(2),
            catchError(err => {
              console.error(`Error fetching building detail ${apartment.buildingDetailId}:`, err)
              return of({ statusCode: 404, data: null })
            })
          )
        )

        console.log(`Building detail response status: ${buildingDetailResponse?.statusCode}`)

        if (buildingDetailResponse?.statusCode === 200) {
          buildingDetail = buildingDetailResponse.data
        }
      }

      // Create apartment response
      const apartmentResponse = {
        apartmentId: apartment.apartmentId,
<<<<<<< HEAD
        apartmentName: apartment.apartmentName,
        warrantyDate: apartment.warrantyDate || null,
        buildingDetails: buildingDetail || null
      };
=======
        building: buildingDetail?.building || null
      }
>>>>>>> f2744fc7aa63bd6d1982122cb42eb256f2523f6b

      return {
        isSuccess: true,
        success: true,
        message: "Success",
        data: apartmentResponse
      }
    } catch (error) {
      console.error('Error in getApartmentByResidentAndApartmentId:', error)
      return {
        isSuccess: false,
        success: false,
        message: error.message || 'Unknown error',
        data: null
      }
    }
  }
}
