import { Injectable, Inject } from '@nestjs/common'
import { Payload, RpcException, ClientProxy, ClientGrpc } from '@nestjs/microservices'
import { PrismaClient } from '@prisma/client-building'
import { PrismaClient as PrismaClientUsers } from '@prisma/client-users'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { UUID } from 'crypto'
import { date } from 'joi'
import { buildingsDto } from 'libs/contracts/src/buildings/buildings.dto'
import { CreateBuildingDto } from 'libs/contracts/src/buildings/create-buildings.dto'
import { UpdateBuildingDto } from 'libs/contracts/src/buildings/update-buildings.dto'
import { Observable } from 'rxjs'
import { firstValueFrom, lastValueFrom } from 'rxjs'
import { timeout, catchError, of } from 'rxjs'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'
const USERS_CLIENT = 'USERS_CLIENT'
// Interface for UserService
interface UserService {
  getApartmentById(data: { apartmentId: string }): Observable<any>
  checkUserExists(data: { userId: string; role?: string }): Observable<{
    exists: boolean;
    message: string;
    data?: { userId: string; role: string } | null;
  }>;
}

@Injectable()
export class BuildingsService {
  private prisma = new PrismaClient();
  private prismaUsers = new PrismaClientUsers();
  private userService: UserService
  constructor(
    @Inject(BUILDINGS_CLIENT) private readonly buildingsClient: ClientProxy,
    @Inject(USERS_CLIENT) private readonly usersClient: ClientGrpc,
  ) { this.userService = this.usersClient.getService<UserService>('UserService') }

  // Add this method to forward apartment requests to the users service
  async getApartmentById(apartmentId: string) {
    try {
      console.log(
        '🚀 ~ BuildingsService ~ getApartmentById ~ apartmentId:',
        apartmentId,
      )

      // Forward the request to the Users service
      const apartmentResponse = await firstValueFrom(
        this.buildingsClient.send('get_apartment_by_id', { apartmentId }),
      )

      return apartmentResponse
    } catch (error) {
      console.error('Error getting apartment from users service:', error)
      throw new RpcException({
        statusCode: 500,
        message: `Error fetching apartment data: ${error.message}`,
      })
    }
  }

  // Create a new building
  async createBuilding(CreateBuildingDto: CreateBuildingDto) {
    try {
      // Validate areaId if provided
      if (CreateBuildingDto.areaId) {
        const areaExists = await this.validateAreaId(CreateBuildingDto.areaId);
        if (!areaExists) {
          return {
            statusCode: 404,
            message: `Không tìm thấy khu vực với ID ${CreateBuildingDto.areaId}`,
            error: 'Not Found'
          };
        }
      }

      // Validate managerId if provided
      if (CreateBuildingDto.manager_id) {
        const managerExists = await this.validateManagerId(CreateBuildingDto.manager_id);
        if (!managerExists) {
          return {
            statusCode: 404,
            message: `Không tìm thấy quản lý với ID ${CreateBuildingDto.manager_id}`,
            error: 'Not Found'
          };
        }
      }

      const newBuilding = await this.prisma.building.create({
        data: {
          name: CreateBuildingDto.name,
          description: CreateBuildingDto.description,
          numberFloor: CreateBuildingDto.numberFloor,
          imageCover: CreateBuildingDto.imageCover,
          areaId: CreateBuildingDto.areaId,
          manager_id: CreateBuildingDto.manager_id,
          Status: CreateBuildingDto.status,
          construction_date: CreateBuildingDto.construction_date,
          completion_date: CreateBuildingDto.completion_date,
          Warranty_date: CreateBuildingDto.Warranty_date,
        },
      })

      return {
        statusCode: 201,
        message: 'Tạo tòa nhà thành công',
        data: newBuilding,
      }
    } catch (error) {
      console.error('Error during building creation:', error)

      // Check for specific error types from Prisma
      if (error instanceof PrismaClientKnownRequestError) {
        // Foreign key constraint error
        if (error.code === 'P2003') {
          return {
            statusCode: 404,
            message: 'Không tìm thấy bản ghi tham chiếu. Kiểm tra giá trị areaId hoặc managerId.',
            error: 'Not Found'
          };
        }
        // Invalid UUID format
        if (error.code === 'P2023') {
          return {
            statusCode: 400,
            message: 'Định dạng UUID không hợp lệ cho areaId hoặc managerId',
            error: 'Bad Request'
          };
        }
      }

      throw new RpcException({
        statusCode: 400,
        message: `Tạo tòa nhà thất bại: ${error.message}`,
      })
    }
  }

  // Update readBuilding to support pagination
  async readBuilding(paginationParams?: {
    page?: number
    limit?: number
    search?: string
  }) {
    try {
      // Default values if not provided
      const page = paginationParams?.page || 1
      const limit = paginationParams?.limit || 10
      const search = paginationParams?.search || ''

      // Calculate skip value for pagination
      const skip = (page - 1) * limit

      // Create where condition for search
      const where: any = {}
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      // Get paginated data
      const [buildings, total] = await Promise.all([
        this.prisma.building.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.building.count({ where }),
      ])

      if (buildings.length === 0) {
        return {
          statusCode: 200,
          message: 'Không tìm thấy tòa nhà nào',
          data: [],
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        }
      }

      return {
        statusCode: 200,
        message: 'Lấy danh sách tòa nhà thành công',
        data: buildings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      }
    } catch (error) {
      console.error('Error retrieving buildings:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách tòa nhà!',
      })
    }
  }

  // Update an existing building
  async getBuildingById(buildingId: string) {
    try {
      console.log(
        `[BuildingsService] Fetching building with ID: ${buildingId}`,
      )

      if (!buildingId) {
        console.error('[BuildingsService] Building ID is null or undefined')
        return {
          statusCode: 400,
          message: 'ID tòa nhà không hợp lệ',
        }
      }

      const building = await this.prisma.building.findUnique({
        where: { buildingId },
        include: {
          area: true,
          buildingDetails: {
            include: {
              locationDetails: true
            }
          }
        },
      })

      if (!building) {
        console.log(
          `[BuildingsService] Building not found for ID: ${buildingId}`,
        )
        return {
          statusCode: 404,
          message: 'Không tìm thấy tòa nhà',
        }
      }

      console.log(
        `[BuildingsService] Successfully retrieved building: ${buildingId}`,
      )
      return {
        statusCode: 200,
        message: 'Lấy thông tin tòa nhà thành công',
        data: building,
      }
    } catch (error) {
      console.error('[BuildingsService] Error in getBuildingById:', error)

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2023') {
          return {
            statusCode: 400,
            message: 'Định dạng UUID không hợp lệ cho ID tòa nhà',
          }
        }
        return {
          statusCode: 404,
          message: 'Không tìm thấy tòa nhà hoặc lỗi cơ sở dữ liệu',
        }
      }

      return {
        statusCode: 500,
        message: 'Lỗi máy chủ khi lấy thông tin tòa nhà',
      }
    }
  }

  // Update an existing building
  async updateBuilding(UpdateBuildingDto: UpdateBuildingDto) {
    try {
      // Check if building exists
      const buildingExists = await this.checkBuildingExists(UpdateBuildingDto.buildingId);
      if (!buildingExists) {
        return {
          statusCode: 404,
          message: `Không tìm thấy tòa nhà với ID ${UpdateBuildingDto.buildingId}`,
          error: 'Not Found'
        };
      }

      // Validate areaId if provided
      if (UpdateBuildingDto.areaId) {
        const areaExists = await this.validateAreaId(UpdateBuildingDto.areaId);
        if (!areaExists) {
          return {
            statusCode: 404,
            message: `Không tìm thấy khu vực với ID ${UpdateBuildingDto.areaId}`,
            error: 'Not Found'
          };
        }
      }

      // Validate managerId if provided
      if (UpdateBuildingDto.manager_id) {
        const managerExists = await this.validateManagerId(UpdateBuildingDto.manager_id);
        if (!managerExists) {
          return {
            statusCode: 404,
            message: `Không tìm thấy quản lý với ID ${UpdateBuildingDto.manager_id}`,
            error: 'Not Found'
          };
        }
      }

      const updatedBuilding = await this.prisma.building.update({
        where: {
          buildingId: UpdateBuildingDto.buildingId,
        },
        data: {
          name: UpdateBuildingDto.name,
          description: UpdateBuildingDto.description,
          numberFloor: UpdateBuildingDto.numberFloor,
          imageCover: UpdateBuildingDto.imageCover,
          areaId: UpdateBuildingDto.areaId,
          manager_id: UpdateBuildingDto.manager_id,
          Status: UpdateBuildingDto.status,
          construction_date: UpdateBuildingDto.construction_date,
          completion_date: UpdateBuildingDto.completion_date,
        },
      })

      return {
        statusCode: 200,
        message: 'Cập nhật tòa nhà thành công',
        data: updatedBuilding,
      }
    } catch (error) {
      console.error('Error during building update:', error)

      // Check for specific error types from Prisma
      if (error instanceof PrismaClientKnownRequestError) {
        // Record not found
        if (error.code === 'P2025') {
          return {
            statusCode: 404,
            message: `Không tìm thấy tòa nhà với ID ${UpdateBuildingDto.buildingId}`,
            error: 'Not Found'
          };
        }
        // Foreign key constraint error
        if (error.code === 'P2003') {
          return {
            statusCode: 404,
            message: 'Không tìm thấy bản ghi tham chiếu. Kiểm tra giá trị areaId hoặc managerId.',
            error: 'Not Found'
          };
        }
        // Invalid UUID format
        if (error.code === 'P2023') {
          return {
            statusCode: 400,
            message: 'Định dạng UUID không hợp lệ cho areaId hoặc managerId',
            error: 'Bad Request'
          };
        }
      }

      throw new RpcException({
        statusCode: 400,
        message: `Cập nhật tòa nhà thất bại: ${error.message}`,
      })
    }
  }

  // Delete a building by buildingId
  async deleteBuilding(buildingId: string) {
    try {
      // Check if building exists
      const building = await this.prisma.building.findUnique({
        where: { buildingId },
        include: {
          buildingDetails: {
            include: {
              locationDetails: true,
              device: true
            }
          }
        }
      });

      if (!building) {
        return {
          statusCode: 404,
          message: 'Không tìm thấy tòa nhà với ID đã cung cấp',
        }
      }

      // Start a transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx) => {
        // 1. Delete all CrackRecords related to LocationDetails
        for (const buildingDetail of building.buildingDetails) {
          for (const location of buildingDetail.locationDetails) {
            await tx.crackRecord.deleteMany({
              where: { locationDetailId: location.locationDetailId }
            });
          }

          // 2. Delete all TechnicalRecords and MaintenanceHistory related to Devices
          for (const device of buildingDetail.device) {
            await tx.technicalRecord.deleteMany({
              where: { device_id: device.device_id }
            });

            await tx.maintenanceHistory.deleteMany({
              where: { device_id: device.device_id }
            });
          }

          // 3. Delete all Devices related to BuildingDetail
          await tx.device.deleteMany({
            where: { buildingDetailId: buildingDetail.buildingDetailId }
          });

          // 4. Delete all LocationDetails related to BuildingDetail
          await tx.locationDetail.deleteMany({
            where: { buildingDetailId: buildingDetail.buildingDetailId }
          });
        }

        // 5. Delete all BuildingDetails related to Building
        await tx.buildingDetail.deleteMany({
          where: { buildingId }
        });

        // 6. Finally delete the Building itself
        const deletedBuilding = await tx.building.delete({
          where: { buildingId }
        });

        return {
          statusCode: 200,
          message: 'Xóa tòa nhà và tất cả dữ liệu liên quan thành công',
          data: deletedBuilding,
        }
      });
    } catch (error) {
      console.error('Error during building deletion:', error);

      if (error instanceof PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        if (error.code === 'P2025') {
          return {
            statusCode: 404,
            message: 'Không tìm thấy tòa nhà',
          }
        }
        if (error.code === 'P2023') {
          return {
            statusCode: 400,
            message: 'Định dạng ID không hợp lệ',
          }
        }
      }

      throw new RpcException({
        statusCode: 500,
        message: `Xóa tòa nhà thất bại: ${error.message}`,
      })
    }
  }

  async checkAreaExists(areaName: string) {
    console.log(`Checking area existence for: ${areaName}`)
    const area = await this.prisma.area.findFirst({
      where: { name: areaName },
    })

    console.log(`Area check result: ${area ? 'Found' : 'Not Found'}`)
    return area
  }

  async checkBuildingExists(buildingId: string) {
    try {
      console.log(`Checking building existence for ID: ${buildingId}`)

      if (!buildingId) {
        console.error('Building ID is required')
        return null
      }

      const building = await this.prisma.building.findUnique({
        where: { buildingId },
      })

      if (!building) {
        console.log(`Building with ID ${buildingId} not found`)
        return null
      }

      console.log(`Building with ID ${buildingId} exists`)
      return building
    } catch (error) {
      console.error('Error checking building existence:', error)
      throw error
    }
  }

  // Validate if an area ID exists
  async validateAreaId(areaId: string | undefined): Promise<boolean> {
    // If no areaId provided, it's optional so validation passes
    if (!areaId) {
      return true;
    }

    try {
      const area = await this.prisma.area.findUnique({
        where: { areaId },
      });

      return !!area; // Returns true if area exists, false otherwise
    } catch (error) {
      console.error(`Error validating area ID ${areaId}:`, error);
      return false;
    }
  }

  // Validate if a manager ID exists by checking in users microservice
  async validateManagerId(managerId: string | undefined): Promise<boolean> {
    // If no managerId provided, it's optional so validation passes
    if (!managerId) {
      return true;
    }

    try {
      // Call Users microservice to check if the manager exists
      const userResponse = await firstValueFrom(
        this.userService.checkUserExists({
          userId: managerId,
          role: 'Manager' // Optionally check if the user has the Manager role
        }).pipe(
          timeout(5000), // 5 second timeout
          catchError(err => {
            console.error(`Timeout or error validating manager ID ${managerId}:`, err);
            return of({ exists: false });
          })
        )
      );

      return userResponse?.exists || false;
    } catch (error) {
      console.error(`Error validating manager ID ${managerId}:`, error);
      return false;
    }
  }

  async getAllResidentsByBuildingId(buildingId: string) {
    console.log(`[BuildingsService] Getting residents for building ID: ${buildingId}`)
    try {
      if (!buildingId) {
        console.error('[BuildingsService] Building ID is null or undefined')
        return {
          statusCode: 400,
          message: 'ID tòa nhà là bắt buộc',
          data: []
        }
      }

      // First get the building with its details
      console.log(`[BuildingsService] Fetching building details for ID: ${buildingId}`)
      const building = await this.prisma.building.findUnique({
        where: { buildingId },
        include: {
          buildingDetails: true
        }
      })

      if (!building) {
        console.error(`[BuildingsService] Building not found for ID: ${buildingId}`)
        return {
          statusCode: 404,
          message: 'Không tìm thấy tòa nhà',
          data: []
        }
      }

      console.log(`[BuildingsService] Found building with ${building.buildingDetails.length} details`)

      if (building.buildingDetails.length === 0) {
        console.log(`[BuildingsService] No building details found for building ID: ${buildingId}`)
        return {
          statusCode: 200,
          message: 'Không tìm thấy chi tiết tòa nhà',
          data: []
        }
      }

      // Get all apartments in this building's details
      const buildingDetailIds = building.buildingDetails.map(detail => detail.buildingDetailId)
      console.log(`[BuildingsService] Fetching apartments for building detail IDs:`, buildingDetailIds)

      try {
        const apartments = await this.prismaUsers.apartment.findMany({
          where: {
            buildingDetailId: {
              in: buildingDetailIds
            }
          },
          include: {
            owner: true
          }
        })

        console.log(`[BuildingsService] Found ${apartments.length} apartments`)

        if (apartments.length === 0) {
          console.log(`[BuildingsService] No apartments found for building ID: ${buildingId}`)
          return {
            statusCode: 200,
            message: 'Không tìm thấy căn hộ nào',
            data: []
          }
        }

        // Extract unique owners and remove the password field
        const residents = new Map()
        apartments.forEach(apartment => {
          if (apartment.owner) {
            const { password, ...ownerWithoutPassword } = apartment.owner
            residents.set(ownerWithoutPassword.userId, ownerWithoutPassword)
          }
        })

        const uniqueResidents = Array.from(residents.values())
        console.log(`[BuildingsService] Found ${uniqueResidents.length} unique residents`)

        return {
          statusCode: 200,
          message: 'Lấy danh sách cư dân thành công',
          data: uniqueResidents
        }
      } catch (error) {
        console.error('[BuildingsService] Error fetching apartments:', error)
        return {
          statusCode: 500,
          message: 'Lỗi khi lấy danh sách căn hộ',
          data: []
        }
      }
    } catch (error) {
      console.error('[BuildingsService] Error getting residents:', error)
      return {
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách cư dân',
        data: []
      }
    }
  }

  async getAllResidentsByBuildingDetailId(buildingDetailId: string) {
    console.log(`[BuildingsService] Getting residents for building detail ID: ${buildingDetailId}`)
    try {
      if (!buildingDetailId) {
        console.error('[BuildingsService] Building detail ID is null or undefined')
        return {
          statusCode: 400,
          message: 'ID chi tiết tòa nhà là bắt buộc',
          data: []
        }
      }

      // Get all apartments directly with the buildingDetailId
      try {
        const apartments = await this.prismaUsers.apartment.findMany({
          where: {
            buildingDetailId: buildingDetailId
          },
          include: {
            owner: true
          }
        })

        console.log(`[BuildingsService] Found ${apartments.length} apartments for building detail ID: ${buildingDetailId}`)

        if (apartments.length === 0) {
          console.log(`[BuildingsService] No apartments found for building detail ID: ${buildingDetailId}`)
          return {
            statusCode: 200,
            message: 'Không tìm thấy căn hộ nào',
            data: []
          }
        }

        // Extract unique owners and remove the password field
        const residents = new Map()
        apartments.forEach(apartment => {
          if (apartment.owner) {
            const { password, ...ownerWithoutPassword } = apartment.owner
            residents.set(ownerWithoutPassword.userId, ownerWithoutPassword)
          }
        })

        const uniqueResidents = Array.from(residents.values())
        console.log(`[BuildingsService] Found ${uniqueResidents.length} unique residents`)

        return {
          statusCode: 200,
          message: 'Lấy danh sách cư dân thành công',
          data: uniqueResidents
        }
      } catch (error) {
        console.error('[BuildingsService] Error fetching apartments by building detail ID:', error)
        return {
          statusCode: 500,
          message: 'Lỗi khi lấy danh sách căn hộ',
          data: []
        }
      }
    } catch (error) {
      console.error('[BuildingsService] Error getting residents by building detail ID:', error)
      return {
        statusCode: 500,
        message: 'Lỗi khi lấy danh sách cư dân',
        data: []
      }
    }
  }

  // Get buildings by manager ID
  async getBuildingsByManagerId(managerId: string, params?: { page?: number; limit?: number; search?: string }) {
    try {
      if (!managerId) {
        return {
          statusCode: 404,
          message: 'ID quản lý không hợp lệ',
          data: []
        }
      }

      const pageNum = Math.max(1, params?.page || 1);
      const limitNum = Math.min(50, Math.max(1, params?.limit || 10));
      const skip = (pageNum - 1) * limitNum;

      // First get all buildings managed by this manager
      const buildings = await this.prisma.building.findMany({
        where: {
          manager_id: managerId
        },
        include: {
          area: true
        }
      });

      if (!buildings || buildings.length === 0) {
        return {
          statusCode: 404,
          message: 'Không tìm thấy tòa nhà nào cho quản lý này',
          data: [],
          meta: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            totalPages: 0
          }
        }
      }

      const buildingIds = buildings.map(b => b.buildingId);

      // Create where condition for buildingDetail search
      const where = {
        buildingId: {
          in: buildingIds
        },
        ...(params?.search ? {
          name: {
            contains: params.search,
            mode: 'insensitive' as const
          }
        } : {})
      };

      // Get building details with pagination
      const [buildingDetails, total] = await Promise.all([
        this.prisma.buildingDetail.findMany({
          where,
          include: {
            locationDetails: true
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.buildingDetail.count({ where })
      ]);

      if (!buildingDetails || buildingDetails.length === 0) {
        return {
          statusCode: 404,
          message: 'Không tìm thấy chi tiết tòa nhà nào phù hợp',
          data: [],
          meta: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            totalPages: 0
          }
        }
      }

      // Group buildingDetails by building
      const buildingsMap = new Map();
      buildings.forEach(building => {
        buildingsMap.set(building.buildingId, {
          ...building,
          buildingDetails: []
        });
      });

      buildingDetails.forEach(detail => {
        const building = buildingsMap.get(detail.buildingId);
        if (building) {
          building.buildingDetails.push(detail);
        }
      });

      // Convert map to array and filter out buildings with no matching details
      const resultBuildings = Array.from(buildingsMap.values())
        .filter(building => building.buildingDetails.length > 0);

      return {
        statusCode: 200,
        message: 'Lấy danh sách tòa nhà thành công',
        data: resultBuildings,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Lỗi máy chủ khi lấy danh sách tòa nhà cho quản lý',
        error: error.message
      }
    }
  }

  // Get building information using buildingDetailId
  async getBuildingFromBuildingDetail(buildingDetailId: string) {
    try {
      if (!buildingDetailId) {
        return new ApiResponse(false, 'ID chi tiết tòa nhà không hợp lệ', null);
      }

      // First, get the buildingDetail to find the buildingId
      const buildingDetail = await this.prisma.buildingDetail.findUnique({
        where: { buildingDetailId },
        select: { buildingId: true }
      });

      if (!buildingDetail) {
        return new ApiResponse(false, 'Không tìm thấy chi tiết tòa nhà', null);
      }

      // Now get the building with this buildingId, including warranty info
      const building = await this.prisma.building.findUnique({
        where: { buildingId: buildingDetail.buildingId },
        include: {
          area: true
        }
      });

      if (!building) {
        return new ApiResponse(false, 'Không tìm thấy tòa nhà', null);
      }

      return new ApiResponse(true, 'Lấy thông tin tòa nhà thành công', building);
    } catch (error) {
      console.error(`Error getting building from buildingDetailId ${buildingDetailId}:`, error);
      return new ApiResponse(false, `Lỗi khi lấy thông tin tòa nhà: ${error.message}`, null);
    }
  }
}
