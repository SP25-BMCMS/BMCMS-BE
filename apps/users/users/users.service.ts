import { BUILDINGDETAIL_PATTERN } from '@app/contracts/BuildingDetails/buildingdetails.patterns'
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto'
import {
  HttpStatus,
  Inject,
  Injectable
} from '@nestjs/common'
import { ClientProxy, RpcException } from '@nestjs/microservices'
import { AccountStatus, PositionName, Role, StaffStatus } from '@prisma/client-users'
import * as bcrypt from 'bcrypt'
import {
  catchError,
  firstValueFrom,
  of,
  retry,
  throwError,
  timeout,
} from 'rxjs'
import { BUILDINGS_PATTERN } from '../../../libs/contracts/src/buildings/buildings.patterns'
import { AREAS_PATTERN } from '../../../libs/contracts/src/Areas/Areas.patterns'
import { PrismaService } from '../prisma/prisma.service'
import { UserDto } from '@app/contracts/users/user.dto'
import { createUserDto } from '@app/contracts/users/create-user.dto'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'
import { CreateWorkingPositionDto } from '@app/contracts/users/create-working-position.dto'
import { GrpcMethod } from '@nestjs/microservices'
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto'
import { PrismaClient as TasksPrismaClient } from '@prisma/client-Task'
import { PrismaClient as TasksPrismaClientSchedule } from '@prisma/client-schedule'

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'
const CRACKS_CLIENT = 'CRACKS_CLIENT'
const TASKS_CLIENT = 'TASK_CLIENT'

const CRACK_PATTERN = {
  GET_CRACK_REPORT: { cmd: 'get-crack-report-by-id' }
}

@Injectable()
export class UsersService {
  private tasksPrisma: TasksPrismaClient
  private tasksPrismaSchedule: TasksPrismaClientSchedule

  constructor(
    private prisma: PrismaService,
    @Inject('BUILDINGS_CLIENT') private buildingsClient: ClientProxy,
    @Inject('CRACKS_CLIENT') private cracksClient: ClientProxy,
    @Inject('TASK_CLIENT') private taskClient: ClientProxy,
  ) {
    this.tasksPrisma = new TasksPrismaClient()
  }

  async getUserByUsername(username: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({ where: { username } })
    if (!user)
      throw new RpcException({
        statusCode: 401,
        message: 'Sai số điện thoại hoặc mật khẩu',
      })
    return user
  }

  async getUserByPhone(phone: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({ where: { phone } })
    if (!user)
      throw new RpcException({
        statusCode: 401,
        message: 'Sai số điện thoại hoặc mật khẩu',
      })
    return user
  }

  async getUserByEmail(email: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user)
      throw new RpcException({
        statusCode: 401,
        message: 'Email không tồn tại',
      })
    return user
  }

  async getUserById(userId: string): Promise<any> {
    const userRaw = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        userDetails: {
          include: {
            position: true,
            department: true,
          }
        },
        apartments: true,
      },
    })

    if (!userRaw)
      throw new RpcException({
        statusCode: 401,
        message: 'StaffId not found',
      })

    // Create a formatted response to avoid duplicate fields
    const { password, ...userWithoutPassword } = userRaw

    // Base user response
    const response = {
      ...userWithoutPassword,
      dateOfBirth: userWithoutPassword.dateOfBirth ? userWithoutPassword.dateOfBirth.toISOString() : null,
    }

    // Format userDetails to avoid duplicates
    if (response.userDetails) {
      const userDetails = response.userDetails
      let formattedUserDetails: any = {
        staffStatus: userDetails.staffStatus,
      }

      // Add position if it exists
      if (userDetails.position) {
        formattedUserDetails.position = {
          positionId: userDetails.position.positionId,
          positionName: userDetails.position.positionName.toString(),
          description: userDetails.position.description,
        }
      }

      // Add department if it exists
      if (userDetails.department) {
        formattedUserDetails.department = {
          departmentId: userDetails.department.departmentId,
          departmentName: userDetails.department.departmentName,
          description: userDetails.department.description || '',
          area: userDetails.department.area || '',
        }
      }

      // Replace userDetails with formatted version
      response.userDetails = formattedUserDetails
    }

    return response
  }

  async signup(userData: createUserDto): Promise<ApiResponse<any>> {
    try {
      // Check if building exists for each apartment if user is a resident
      if (
        userData.role === Role.Resident &&
        userData.apartments &&
        userData.apartments.length > 0
      ) {
        console.log('Validating building IDs for resident apartments...')

        for (const apartment of userData.apartments) {
          try {
            console.log(`Checking building ID: ${apartment.buildingDetailId}`)

            const buildingResponse = await firstValueFrom(
              this.buildingsClient
                .send(BUILDINGDETAIL_PATTERN.CHECK_EXISTS, {
                  buildingDetailId: apartment.buildingDetailId,
                })
                .pipe(
                  timeout(5000),
                  catchError((err) => {
                    console.error(
                      'Error communicating with building service:',
                      err,
                    )
                    throw new Error('Building service unavailable')
                  }),
                ),
            )

            console.log('Building service response:', buildingResponse)

            if (
              buildingResponse.statusCode === 404 ||
              !buildingResponse.exists
            ) {
              return new ApiResponse(
                false,
                `Building with ID ${apartment.buildingDetailId} not found`,
                null,
              )
            }
          } catch (error) {
            console.error('Error validating building:', error)
            return new ApiResponse(
              false,
              error.message || 'Error validating building',
              null,
            )
          }
        }
      }

      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ username: userData.username }, { email: userData.email }],
        },
      })

      if (existingUser) {
        return new ApiResponse(false, 'Username hoặc Email đã tồn tại', null)
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10)

      let newUser
      if (userData.role === Role.Admin || userData.role === Role.Manager) {
        newUser = await this.prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            phone: userData.phone,
            role: userData.role,
            dateOfBirth: userData.dateOfBirth
              ? new Date(userData.dateOfBirth)
              : null,
            gender: userData.gender ?? null,
            accountStatus:
              userData.accountStatus === 'Inactive'
                ? AccountStatus.Inactive
                : AccountStatus.Active, // Default to Active for Admin/Manager
          },
        })
      } else {
        newUser = await this.prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            phone: userData.phone,
            role: userData.role,
            dateOfBirth: userData.dateOfBirth
              ? new Date(userData.dateOfBirth)
              : null,
            gender: userData.gender ?? null,
            accountStatus:
              userData.role === Role.Resident
                ? AccountStatus.Inactive
                : userData.accountStatus === 'Inactive'
                  ? AccountStatus.Inactive
                  : AccountStatus.Active,
            userDetails:
              userData.role === Role.Staff
                ? {
                  create: {
                    positionId: userData.positionId ?? null,
                    departmentId: userData.departmentId ?? null,
                    staffStatus: userData.staffStatus ?? StaffStatus.Active,
                    image: userData.image ?? null,
                  },
                }
                : undefined,
            apartments:
              userData.role === Role.Resident && userData.apartments
                ? {
                  create: userData.apartments.map((apartment) => ({
                    apartmentName: apartment.apartmentName,
                    buildingDetailId: apartment.buildingDetailId,
                  })),
                }
                : undefined,
          },
        })
      }

      // ✅ Truy vấn lại để lấy đầy đủ thông tin
      const fullUser = await this.prisma.user.findUnique({
        where: { userId: newUser.userId },
        include: {
          apartments: true,
          userDetails: true,
        },
      })

      return new ApiResponse(true, 'User đã được tạo thành công', {
        userId: fullUser?.userId,
        username: fullUser?.username,
        email: fullUser?.email,
        phone: fullUser?.phone,
        role: fullUser?.role,
        dateOfBirth: fullUser?.dateOfBirth
          ? fullUser.dateOfBirth.toISOString()
          : null,
        gender: fullUser?.gender ?? null,
        accountStatus: fullUser?.accountStatus ?? null,
        userDetails: fullUser?.userDetails
          ? {
            positionId: fullUser?.userDetails.positionId,
            departmentId: fullUser?.userDetails.departmentId,
            staffStatus: fullUser?.userDetails.staffStatus,
            image: fullUser?.userDetails.image,
          }
          : null,
        apartments:
          fullUser?.apartments.map((apartment) => ({
            apartmentName: apartment.apartmentName,
            buildingDetailId: apartment.buildingDetailId,
          })) ?? [],
      })
    } catch (error) {
      console.error('🔥 Lỗi trong UsersService:', error)
      return new ApiResponse(false, 'Lỗi không xác định khi tạo user', null)
    }
  }

  async updateUser(
    userId: string,
    data: Partial<createUserDto>,
  ): Promise<UserDto> {
    const user = await this.getUserById(userId)
    if (!user)
      throw new RpcException({ statusCode: 404, message: 'User not found' })

    // Validate building IDs if apartments are being updated
    if (data.apartments && data.apartments.length > 0) {
      console.log('Validating building IDs for apartment updates...')

      for (const apartment of data.apartments) {
        try {
          console.log(`Checking building ID: ${apartment.buildingDetailId}`)

          const buildingResponse = await firstValueFrom(
            this.buildingsClient
              .send(BUILDINGDETAIL_PATTERN.CHECK_EXISTS, {
                buildingDetailId: apartment.buildingDetailId,
              })
              .pipe(
                timeout(5000),
                catchError((err) => {
                  console.error(
                    'Error communicating with building service:',
                    err,
                  )
                  throw new RpcException({
                    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                    message: 'Building service unavailable',
                  })
                }),
              ),
          )

          if (buildingResponse.statusCode === 404 || !buildingResponse.exists) {
            throw new RpcException({
              statusCode: HttpStatus.NOT_FOUND,
              message: `Building with ID ${apartment.buildingDetailId} not found`,
            })
          }
        } catch (error) {
          if (error instanceof RpcException) {
            throw error
          }
          throw new RpcException({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Error validating building',
          })
        }
      }
    }

    // Prepare data for update, handling accountStatus conversion
    const updateData = {
      ...data,
      accountStatus: data.accountStatus
        ? data.accountStatus === 'Active'
          ? AccountStatus.Active
          : AccountStatus.Inactive
        : undefined,
    }

    // Remove accountStatus from original data object to avoid type issues
    if (data.accountStatus) {
      delete data.accountStatus
    }

    return this.prisma.user.update({
      where: { userId },
      data: {
        ...data, // Other fields
        accountStatus: updateData.accountStatus, // Use converted enum value
        apartments: data.apartments
          ? {
            set: [], // 🛠 Xóa danh sách cũ (nếu cần)
            create: data.apartments.map((apt) => ({
              apartmentName: apt.apartmentName,
              buildingDetailId: apt.buildingDetailId,
            })),
          }
          : undefined, // ✅ Chỉ cập nhật nếu có apartments
      },
    })
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    await this.prisma.user.delete({ where: { userId } })
    return { message: 'User deleted successfully' }
  }

  async getAllUsers(): Promise<{ users: UserDto[] }> {
    const users = await this.prisma.user.findMany()
    return { users: users }
  }

  async createWorkingPosition(data: CreateWorkingPositionDto) {
    try {
      console.log('Received data:', data) // Debug dữ liệu nhận từ gRPC

      // Map string position names to enum values
      let positionNameEnum: PositionName

      // Convert string to enum based on Prisma schema
      switch (data.positionName) {
        case 'Leader':
          positionNameEnum = PositionName.Leader
          break
        case 'Technician':
          positionNameEnum = PositionName.Technician
          break
        case 'Janitor':
          positionNameEnum = PositionName.Janitor
          break
        case 'Maintenance_Technician':
          positionNameEnum = PositionName.Maintenance_Technician
          break
        default:
          // For unsupported position names, use Leader as default
          positionNameEnum = PositionName.Leader
          break
      }

      // Create the position
      const newPosition = await this.prisma.workingPosition.create({
        data: {
          positionName: positionNameEnum,
          description: data.description,
        },
      })

      return {
        isSuccess: true,
        message: 'Working Position created successfully',
        data: {
          positionId: newPosition.positionId,
          // Return the string representation of the position name
          positionName: data.positionName,
          description: newPosition.description,
        },
      }
    } catch (error) {
      console.error('🔥 Error creating working position:', error)
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to create working position',
      })
    }
  }

  async getAllWorkingPositions(): Promise<{
    workingPositions: {
      positionId: string
      positionName: string
      description?: string
    }[]
  }> {
    try {
      const positions = await this.prisma.workingPosition.findMany()
      return {
        workingPositions: positions.map((position) => ({
          positionId: position.positionId,
          positionName: position.positionName.toString(),
          description: position.description,
        })),
      }
    } catch (error) {
      console.error('Error fetching working positions:', error)
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch working positions',
      })
    }
  }

  async getWorkingPositionById(data: { positionId: string }): Promise<{
    isSuccess: boolean
    message: string
    data: {
      positionId: string
      positionName: string
      description?: string
    } | null
  }> {
    try {
      const position = await this.prisma.workingPosition.findUnique({
        where: { positionId: data.positionId },
      })

      if (!position) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Working Position not found',
        })
      }

      return {
        isSuccess: true,
        message: 'Working Position retrieved successfully',
        data: {
          positionId: position.positionId,
          positionName: position.positionName.toString(),
          description: position.description,
        },
      }
    } catch (error) {
      console.error('Error fetching working position:', error)
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to retrieve working position',
      })
    }
  }

  async deleteWorkingPosition(data: { positionId: string }): Promise<{
    isSuccess: boolean
    message: string
    data: {
      positionId: string
      positionName: string
      description?: string
    } | null
  }> {
    try {
      const deletedPosition = await this.prisma.workingPosition.delete({
        where: { positionId: data.positionId },
      })

      return {
        isSuccess: true,
        message: 'Working Position deleted successfully',
        data: {
          positionId: deletedPosition.positionId,
          positionName: deletedPosition.positionName.toString(),
          description: deletedPosition.description,
        },
      }
    } catch (error) {
      console.error('Error deleting working position:', error)
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to delete working position',
      })
    }
  }

  async createDepartment(data: CreateDepartmentDto) {
    try {
      console.log(
        '📥 Checking if area exists in Building Microservice:',
        data.area,
      )

      const areaExistsResponse = await firstValueFrom(
        this.buildingsClient
          .send('check_area_exists', { areaName: data.area })
          .pipe(
            timeout(5000),
            catchError((err) => {
              console.error('❌ Error contacting Building Microservice:', err)
              throw new RpcException({
                statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                message: 'Building Microservice is not responding',
              })
            }),
          ),
      )

      if (!areaExistsResponse.exists) {
        console.error(
          `❌ Area '${data.area}' does not exist in Building Microservice`,
        )
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Area '${data.area}' does not exist in Building Microservice`,
        })
      }

      console.log('✅ Area exists, creating Department...')

      const newDepartment = await this.prisma.department.create({
        data: {
          departmentName: data.departmentName,
          description: data.description,
          area: data.area,
        },
      })

      return {
        isSuccess: true,
        message: 'Department created successfully',
        data: {
          departmentId: newDepartment.departmentId,
          departmentName: newDepartment.departmentName,
          description: newDepartment.description,
          area: newDepartment.area,
        },
      }
    } catch (error) {
      console.error('🔥 Error creating department:', error)

      if (error instanceof RpcException) {
        throw error
      }

      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Unexpected error creating department',
      })
    }
  }

  private async getBuildingDetails(buildingDetailId: string) {
    try {
      const response = await firstValueFrom(
        this.buildingsClient
          .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
          .pipe(
            timeout(5000),
            retry(2), // Retry 2 times before giving up
            catchError((err) => {
              console.error(
                `Error fetching buildingDetail ${buildingDetailId} after retries:`,
                err,
              )
              return of({
                statusCode: 404,
                data: null,
              })
            }),
          ),
      )
      return response
    } catch (error) {
      console.error(`Failed to get buildingDetail ${buildingDetailId}:`, error)
      return {
        statusCode: 404,
        data: null,
      }
    }
  }

  async getApartmentsByResidentId(residentId: string): Promise<{
    isSuccess: boolean
    message: string
    data: {
      apartmentId: string
      apartmentName: string
      warrantyDate: string | null
      buildingDetails: any
    }[]
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          userId: residentId,
          role: Role.Resident,
        },
        include: { apartments: true },
      })

      if (!user) {
        return { isSuccess: false, message: 'Resident not found', data: [] }
      }

      // Xử lý các căn hộ của người dùng song song
      const apartmentPromises = user.apartments.map(async (apartment) => {
        const buildingResponse = await this.getBuildingDetails(
          apartment.buildingDetailId,
        )

        return {
          apartmentId: apartment.apartmentId,
          apartmentName: apartment.apartmentName,
          warrantyDate: apartment.warrantyDate,
          buildingDetails:
            buildingResponse?.statusCode === 200 ? buildingResponse.data : null
        }
      })

      // Chờ tất cả các chi tiết căn hộ được lấy
      const apartmentsWithBuildings = await Promise.all(apartmentPromises)

      return {
        isSuccess: true,
        message: 'Success',
        data: apartmentsWithBuildings,
      }
    } catch (error) {
      return {
        isSuccess: false,
        message: 'Failed to retrieve apartments',
        data: [],
      }
    }
  }

  async getAllStaff(paginationParams: {
    page?: number
    limit?: number
    search?: string
    role?: string | string[]
  } = {}): Promise<{
    isSuccess: boolean
    message: string
    data: UserDto[]
    pagination?: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }> {
    try {
      const { page = 1, limit = 10, search, role } = paginationParams

      // Handle role filtering
      let roleFilter: any = {
        role: {
          in: [Role.Staff, Role.Admin, Role.Manager]
        }
      }

      if (role) {
        const roleArray = Array.isArray(role) ? role : [role]
        // Map string roles to Role enum
        const mappedRoles = roleArray.map(r => {
          switch (r) {
            case 'Admin': return Role.Admin
            case 'Manager': return Role.Manager
            case 'Staff': return Role.Staff
            default: return r
          }
        })

        roleFilter = { role: { in: mappedRoles } }
      }

      // Apply filters
      const whereClause: any = {
        ...roleFilter
      }

      // Add search filter if provided
      if (search) {
        whereClause.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Count total matching records
      const totalCount = await this.prisma.user.count({
        where: whereClause
      })

      // Fetch paginated results
      const staffMembers = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          userDetails: {
            include: {
              position: true,
              department: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      })

      if (!staffMembers || staffMembers.length === 0) {
        return {
          isSuccess: true,
          message: 'No staff members found',
          data: [],
          pagination: {
            total: 0,
            page: page,
            limit: limit,
            totalPages: 0
          }
        }
      }

      // Convert to user response format without exposing sensitive fields
      const staffData = staffMembers.map((staff) => {
        const { password, ...userWithoutPassword } = staff
        return {
          ...userWithoutPassword,
          dateOfBirth: staff.dateOfBirth
            ? staff.dateOfBirth.toISOString()
            : null,
          userDetails: staff.userDetails
            ? {
              ...staff.userDetails,
              position: staff.userDetails.position
                ? {
                  positionId: staff.userDetails.position.positionId,
                  positionName:
                    staff.userDetails.position.positionName.toString(),
                  description: staff.userDetails.position.description || '',
                }
                : null,
              department: staff.userDetails.department
                ? {
                  departmentId: staff.userDetails.department.departmentId,
                  departmentName:
                    staff.userDetails.department.departmentName,
                  description:
                    staff.userDetails.department.description || '',
                  area: staff.userDetails.department.area || '',
                }
                : null,
            }
            : null,
        }
      })

      return {
        isSuccess: true,
        message: 'Successfully retrieved staff members',
        data: staffData as unknown as UserDto[],
        pagination: {
          total: totalCount,
          page: page,
          limit: limit,
          totalPages: Math.max(1, Math.ceil(totalCount / limit))
        }
      }
    } catch (error) {
      console.error('Error fetching staff members:', error)
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch staff members',
      })
    }
  }

  async updateResidentApartments(
    residentId: string,
    apartments: { apartmentName: string; buildingDetailId: string }[],
  ): Promise<{ isSuccess: boolean; message: string; data: any }> {
    try {
      // Check if user exists and is a Resident
      const user = await this.prisma.user.findUnique({
        where: {
          userId: residentId,
          role: Role.Resident,
        },
        include: {
          apartments: true,
        },
      })

      if (!user) {
        return {
          isSuccess: false,
          message: 'Không tìm thấy cư dân',
          data: null
        }
      }

      // Check for duplicate apartments
      const existingApartments = user.apartments
      const duplicateApartments = apartments.filter((newApt) =>
        existingApartments.some(
          (existingApt) =>
            existingApt.apartmentName === newApt.apartmentName &&
            existingApt.buildingDetailId === newApt.buildingDetailId,
        ),
      )

      if (duplicateApartments.length > 0) {
        const duplicateNames = duplicateApartments
          .map((apt) => apt.apartmentName)
          .join(', ')
        return {
          isSuccess: false,
          message: `Cư dân đã sở hữu các căn hộ sau: ${duplicateNames}`,
          data: null
        }
      }

      const apartmentsWithWarranty = []

      for (const apartment of apartments) {
        try {
          // Validate if buildingDetail exists
          const buildingDetailResponse = await firstValueFrom(
            this.buildingsClient
              .send(BUILDINGDETAIL_PATTERN.CHECK_EXISTS, {
                buildingDetailId: apartment.buildingDetailId,
              })
              .pipe(
                timeout(5000),
                catchError((err) => {
                  return of({
                    statusCode: 503,
                    message: 'Dịch vụ tòa nhà không phản hồi',
                    exists: false
                  })
                }),
              ),
          )

          // if (!buildingDetailResponse.exists) {
          //   return {
          //     isSuccess: false,
          //     message: `Không tìm thấy tòa nhà với ID ${apartment.buildingDetailId}`,
          //     data: null
          //   }
          // }

          const buildingDetailInfo = await firstValueFrom(
            this.buildingsClient
              .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, {
                buildingDetailId: apartment.buildingDetailId,
              })
              .pipe(
                timeout(5000),
                catchError((err) => {
                  console.error('Error getting building details:', err)
                  return of({
                    statusCode: 503,
                    message: 'Dịch vụ tòa nhà không phản hồi',
                    data: null
                  })
                }),
              ),
          )

          if (buildingDetailInfo.statusCode === 200 && buildingDetailInfo.data) {
            // Navigate to the building through building detail
            const buildingId = buildingDetailInfo.data.buildingId

            const buildingResponse = await firstValueFrom(
              this.buildingsClient
                .send(BUILDINGS_PATTERN.GET_BY_ID, {
                  buildingId: buildingId,
                })
                .pipe(
                  timeout(5000),
                  catchError((err) => {
                    console.error('Error getting building information:', err)
                    return of({
                      statusCode: 503,
                      message: 'Dịch vụ tòa nhà không phản hồi',
                      data: null
                    })
                  }),
                ),
            )

            if (buildingResponse.statusCode === 200 && buildingResponse.data) {
              let warrantyDate = null

              if (buildingResponse.data.Warranty_date) {
                try {
                  const warDate = buildingResponse.data.Warranty_date
                  if (typeof warDate === 'string') {
                    warrantyDate = warDate
                  } else {
                    warrantyDate = String(warDate)
                  }
                } catch (error) {
                }
              }

              apartmentsWithWarranty.push({
                ...apartment,
                warrantyDate: warrantyDate
              })
            } else {
              apartmentsWithWarranty.push({
                ...apartment,
                warrantyDate: null
              })
            }
          } else {
            apartmentsWithWarranty.push({
              ...apartment,
              warrantyDate: null
            })
          }
        } catch (error) {
          return {
            isSuccess: false,
            message: 'Lỗi khi kiểm tra thông tin tòa nhà',
            data: null
          }
        }
      }

      // Fetch full user data with userDetails included
      const fullUserData = await this.prisma.user.findUnique({
        where: { userId: residentId },
        include: {
          userDetails: true,
          apartments: true
        }
      })

      // Update apartments by adding new ones without deleting existing ones
      const updatedUser = await this.prisma.user.update({
        where: { userId: residentId },
        data: {
          apartments: {
            create: apartmentsWithWarranty.map(apt => {
              return {
                apartmentName: apt.apartmentName,
                buildingDetailId: apt.buildingDetailId,
                warrantyDate: apt.warrantyDate || null
              }
            }),
          },
        },
        include: {
          apartments: true,
        },
      })

      // Verify data was saved correctly
      const savedApartments = await this.prisma.apartment.findMany({
        where: {
          ownerId: residentId,
          buildingDetailId: {
            in: apartmentsWithWarranty.map(apt => apt.buildingDetailId)
          }
        },
      })

      return {
        isSuccess: true,
        message: 'Cập nhật căn hộ thành công',
        data: {
          userId: updatedUser.userId,
          username: updatedUser.username,
          apartments: updatedUser.apartments,
        },
      }
    } catch (error) {
      return {
        isSuccess: false,
        message: error.message || 'Lỗi khi cập nhật căn hộ',
        data: null,
      }
    }
  }

  async updateAccountStatus(
    userId: string,
    accountStatus: string,
  ): Promise<{ isSuccess: boolean; message: string; data: any }> {
    try {
      // Kiểm tra xem user có tồn tại không
      const user = await this.prisma.user.findUnique({
        where: { userId },
      })

      if (!user) {
        return {
          isSuccess: false,
          message: `Không tìm thấy người dùng với ID: ${userId}`,
          data: null,
        }
      }

      // Chuyển đổi accountStatus string thành enum
      const status =
        accountStatus === 'Active'
          ? AccountStatus.Active
          : AccountStatus.Inactive

      // Cập nhật trạng thái tài khoản
      const updatedUser = await this.prisma.user.update({
        where: { userId },
        data: { accountStatus: status },
      })

      // Lấy thông tin đầy đủ của user sau khi cập nhật
      const fullUser = await this.prisma.user.findUnique({
        where: { userId },
        include: {
          userDetails: {
            include: {
              position: true,
              department: true,
            },
          },
          apartments: true,
        },
      })

      // Format dữ liệu trả về theo dạng JSON phù hợp
      const formattedResponse = {
        accountStatus: fullUser.accountStatus,
      }

      return {
        isSuccess: true,
        message: `Cập nhật trạng thái tài khoản thành ${accountStatus}`,
        data: formattedResponse,
      }
    } catch (error) {
      console.error('Error updating account status:', error)
      return {
        isSuccess: false,
        message: `Lỗi khi cập nhật trạng thái tài khoản: ${error.message}`,
        data: null,
      }
    }
  }

  async checkStaffAreaMatch(staffId: string, crackReportId: string): Promise<{ isSuccess: boolean; message: string; isMatch: boolean }> {
    try {
      // Get staff user with department info
      const staff = await this.prisma.user.findUnique({
        where: { userId: staffId },
        include: {
          userDetails: {
            include: {
              department: true
            }
          }
        }
      })

      if (!staff || !staff.userDetails?.department) {
        return {
          isSuccess: false,
          message: 'Staff not found or no department assigned',
          isMatch: false
        }
      }

      // Get crack report info from crack service
      const crackReportResponse = await firstValueFrom(
        this.cracksClient.send(CRACK_PATTERN.GET_CRACK_REPORT, crackReportId)
          .pipe(
            timeout(5000),
            catchError((err) => {
              console.error('Error getting crack report:', err)
              return of({ isSuccess: false, message: 'Error getting crack report', data: null })
            })
          )
      )

      if (!crackReportResponse || !crackReportResponse.isSuccess || !crackReportResponse.data || crackReportResponse.data.length === 0) {
        return {
          isSuccess: false,
          message: 'Crack report not found',
          isMatch: false
        }
      }

      const crackReport = crackReportResponse.data[0]

      // Get building details to get areaId
      const buildingResponse = await firstValueFrom(
        this.buildingsClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId: crackReport.buildingDetailId })
          .pipe(
            timeout(5000),
            catchError((err) => {
              console.error('Error getting building details:', err)
              return of({ statusCode: 404, data: null })
            })
          )
      )

      if (!buildingResponse || buildingResponse.statusCode !== 200) {
        return {
          isSuccess: false,
          message: 'Building not found',
          isMatch: false
        }
      }

      // Get area details to get area name
      const areaResponse = await firstValueFrom(
        this.buildingsClient.send(AREAS_PATTERN.GET_BY_ID, { areaId: buildingResponse.data.building.area.areaId })
          .pipe(
            timeout(5000),
            catchError((err) => {
              return of({ statusCode: 404, data: null })
            })
          )
      )

      if (!areaResponse || areaResponse.statusCode !== 200) {
        return {
          isSuccess: false,
          message: 'Area not found',
          isMatch: false
        }
      }

      const areaName = areaResponse.data.name

      // Lấy area của staff từ department
      const staffAreaName = staff.userDetails.department.area

      // So sánh area của staff với area của building
      // Đảm bảo so sánh không phân biệt hoa thường
      console.log(`[users.service] Comparing areas: Staff area (${staffAreaName}) vs Building area (${areaName})`)
      const isMatch = staffAreaName.toLowerCase() === areaName.toLowerCase()

      console.log(`[users.service] Area match result: ${isMatch ? 'MATCH' : 'NO MATCH'}`)

      return {
        isSuccess: true,
        message: isMatch
          ? `Nhân viên thuộc khu vực ${staffAreaName} phù hợp với khu vực ${areaName} của công việc`
          : `Nhân viên thuộc khu vực ${staffAreaName} không phù hợp với khu vực ${areaName} của công việc`,
        isMatch
      }
    } catch (error) {
      return {
        isSuccess: false,
        message: 'Error checking area match',
        isMatch: false
      }
    }
  }

  async getUserInfo(data: { userId?: string; username?: string }): Promise<{
    userId: string
    username: string
    email: string
    phone: string
    role: string
    dateOfBirth: string | null
    gender: string | null
    userDetails?: {
      positionId: string | null
      departmentId: string | null
      staffStatus: string | null
      image: string | null
      position?: {
        positionId: string
        positionName: string
        description: string | null
      } | null
      department?: {
        departmentId: string
        departmentName: string
        description: string | null
        area: string | null
      } | null
    } | null
    accountStatus: string
  }> {
    try {
      const { userId, username } = data
      console.log(`GetUserInfo called with userId: ${userId}, username: ${username}`)
      let user

      if (userId) {
        user = await this.prisma.user.findUnique({
          where: { userId },
          include: {
            userDetails: {
              include: {
                position: true,  // Include working position
                department: true  // Include department
              }
            },
          }
        })
      } else if (username) {
        user = await this.prisma.user.findUnique({
          where: { username },
          include: {
            userDetails: {
              include: {
                position: true,  // Include working position
                department: true  // Include department
              }
            },
          }
        })
      }

      if (!user) {
        console.log(`User not found for userId: ${userId} or username: ${username}`)
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
        })
      }


      // Log database values for debugging

      if (user.userDetails) {

        // If position exists, log its properties
        if (user.userDetails.position) {
        } else {
          // Check if position exists as separate record
          if (user.userDetails.positionId) {
            const position = await this.prisma.workingPosition.findUnique({
              where: { positionId: user.userDetails.positionId }
            })
          }
        }

        // If department exists, log its properties
        if (user.userDetails.department) {
        } else {
          // Check if department exists as separate record
          if (user.userDetails.departmentId) {
            const department = await this.prisma.department.findUnique({
              where: { departmentId: user.userDetails.departmentId }
            })
          }
        }
      }

      // Do separate queries to ensure we get the data
      let positionDetails = null
      let departmentDetails = null

      if (user.userDetails) {
        // Get position details directly if needed
        if (user.userDetails.positionId) {
          try {
            const position = user.userDetails.position ||
              await this.prisma.workingPosition.findUnique({
                where: { positionId: user.userDetails.positionId }
              })

            if (position) {
              positionDetails = {
                positionId: position.positionId,
                positionName: position.positionName.toString(),
                description: position.description
              }
            }
          } catch (error) {
          }
        }

        // Get department details directly if needed
        if (user.userDetails.departmentId) {
          try {
            const department = user.userDetails.department ||
              await this.prisma.department.findUnique({
                where: { departmentId: user.userDetails.departmentId }
              })

            if (department) {
              departmentDetails = {
                departmentId: department.departmentId,
                departmentName: department.departmentName,
                description: department.description,
                area: department.area
              }
            }
          } catch (error) {
          }
        }
      }

      const response = {
        userId: user.userId,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
        gender: user.gender,
        userDetails: user.userDetails ? {
          positionId: user.userDetails.positionId,
          departmentId: user.userDetails.departmentId,
          staffStatus: user.userDetails.staffStatus,
          image: user.userDetails.image,
          position: positionDetails,
          department: departmentDetails
        } : null,
        accountStatus: user.accountStatus
      }

      return response
    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Error retrieving user information',
      })
    }
  }

  async getDepartmentById(departmentId: string): Promise<{
    isSuccess: boolean
    message: string
    data: {
      departmentId: string
      departmentName: string
      description: string
      area: string
    } | null
  }> {
    try {
      // Kiểm tra schema đầu tiên
      const departmentModel = this.prisma.department
      if (departmentModel) {
        try {
          // Thử lấy toàn bộ danh sách departments để kiểm tra kết nối
          const allDepartments = await this.prisma.department.findMany({ take: 5 })
        } catch (dbError) {
          // Handle error silently
        }
      }

      // Tiếp tục với truy vấn chính
      const department = await this.prisma.department.findUnique({
        where: { departmentId }
      })

      if (!department) {
        return {
          isSuccess: false,
          message: 'Department not found',
          data: null
        }
      }

      const responseData = {
        departmentId: department.departmentId,
        departmentName: department.departmentName,
        description: department.description || '',
        area: department.area || ''
      }

      return {
        isSuccess: true,
        message: 'Department retrieved successfully',
        data: responseData
      }
    } catch (error) {
      return {
        isSuccess: false,
        message: error.message || 'Error retrieving department',
        data: null
      }
    }
  }

  async updateDepartmentAndWorkingPosition(
    staffId: string,
    departmentId: string,
    positionId: string
  ): Promise<{
    isSuccess: boolean
    message: string
    data: any
  }> {
    try {
      // Check if the staff exists
      const staff = await this.prisma.user.findUnique({
        where: {
          userId: staffId,
          role: { in: ['Staff', 'Manager'] }  // Only staff or manager roles can be updated
        },
        include: {
          userDetails: true
        }
      })


      if (!staff) {
        return {
          isSuccess: false,
          message: 'Nhân viên không tồn tại hoặc không phải là Staff/Manager',
          data: null
        }
      }

      // Check if department exists
      const department = await this.prisma.department.findUnique({
        where: { departmentId }
      })

      if (!department) {
        return {
          isSuccess: false,
          message: 'Phòng ban không tồn tại',
          data: null
        }
      }

      // Check if position exists
      const position = await this.prisma.workingPosition.findUnique({
        where: { positionId }
      })

      if (!position) {
        return {
          isSuccess: false,
          message: 'Vị trí công việc không tồn tại',
          data: null
        }
      }

      // Update or create userDetails
      let userDetails
      try {
        if (staff.userDetails) {

          // The userId field is the primary key in UserDetails, not a relation field for querying
          userDetails = await this.prisma.userDetails.update({
            where: { userId: staffId }, // This is the primary key of UserDetails
            data: {
              departmentId,
              positionId
            },
            include: {
              department: true,
              position: true
            }
          })
        } else {

          // Create new userDetails for this staff with the same userId
          userDetails = await this.prisma.userDetails.create({
            data: {
              userId: staffId, // Use the staff's userId as the primary key for UserDetails
              departmentId,
              positionId
            },
            include: {
              department: true,
              position: true
            }
          })
        }


      } catch (dbError) {
        throw dbError
      }

      // Prepare response
      return {
        isSuccess: true,
        message: 'Cập nhật phòng ban và vị trí công việc thành công',
        data: {
          staffId: staff.userId,
          username: staff.username,
          userDetails: {
            departmentId: userDetails.departmentId,
            positionId: userDetails.positionId,
            department: {
              departmentId: userDetails.department.departmentId,
              departmentName: userDetails.department.departmentName,
              description: userDetails.department.description || '',
              area: userDetails.department.area || ''
            },
            position: {
              positionId: userDetails.position.positionId,
              positionName: userDetails.position.positionName.toString(),
              description: userDetails.position.description || ''
            }
          }
        }
      }
    } catch (error) {
      return {
        isSuccess: false,
        message: `Lỗi khi cập nhật phòng ban và vị trí công việc: ${error.message}`,
        data: null
      }
    }
  }

  async checkStaffAreaMatchWithScheduleJob(data: { staffId: string; scheduleJobId: string }): Promise<{
    isSuccess: boolean
    message: string
    isMatch: boolean
    statusCode?: number
  }> {
    try {
      console.log(`[users.service] Checking staff (${data.staffId}) area match with schedule job (${data.scheduleJobId})`)

      // Get staff user with department and position info
      const staff = await this.prisma.user.findUnique({
        where: { userId: data.staffId },
        include: {
          userDetails: {
            include: {
              position: true,
              department: true
            }
          }
        }
      })

      console.log(`[users.service] Staff details:`, JSON.stringify({
        userId: staff?.userId,
        position: staff?.userDetails?.position?.positionName,
        department: staff?.userDetails?.department?.departmentName,
        area: staff?.userDetails?.department?.area
      }))

      if (!staff) {
        return {
          isSuccess: false,
          message: `Không tìm thấy nhân viên (${data.staffId})`,
          isMatch: false,
          statusCode: 404
        }
      }

      if (!staff.userDetails) {
        return {
          isSuccess: false,
          message: 'Nhân viên chưa được phân công phòng ban và vị trí công việc',
          isMatch: false
        }
      }

      if (!staff.userDetails.position) {
        return {
          isSuccess: false,
          message: 'Nhân viên chưa được phân công vị trí công việc',
          isMatch: false
        }
      }

      if (!staff.userDetails.department) {
        return {
          isSuccess: false,
          message: 'Nhân viên chưa được phân công phòng ban',
          isMatch: false
        }
      }

      // Check if staff is a Maintenance Technician
      if (staff.userDetails.position.positionName !== 'Maintenance_Technician') {
        return {
          isSuccess: false,
          message: `Chỉ nhân viên kỹ thuật bảo trì (Maintenance Technician) mới có thể thực hiện công việc này. Vị trí hiện tại: ${staff.userDetails.position.positionName}`,
          isMatch: false
        }
      }

      // Initialize tasksPrismaSchedule if not already initialized
      if (!this.tasksPrismaSchedule) {
        this.tasksPrismaSchedule = new TasksPrismaClientSchedule()
        console.log(`[users.service] Initialized Schedule PrismaClient`)
      }

      // Get schedule job info
      const scheduleJob = await this.tasksPrismaSchedule.scheduleJob.findUnique({
        where: { schedule_job_id: data.scheduleJobId }
      })

      console.log(`[users.service] Schedule job details:`, JSON.stringify(scheduleJob))

      if (!scheduleJob) {
        return {
          isSuccess: false,
          message: `Không tìm thấy lịch công việc với ID: ${data.scheduleJobId}`,
          isMatch: false,
          statusCode: 404
        }
      }

      // Từ building_id trong scheduleJob, gọi đến building service để lấy thông tin building
      console.log(`[users.service] Getting building info using building_id from scheduleJob: ${scheduleJob.buildingDetailId}`)

      // Kiểm tra xem building_id có tồn tại không
      if (!scheduleJob.buildingDetailId) {
        return {
          isSuccess: false,
          message: 'Lịch công việc không có thông tin tòa nhà',
          isMatch: false
        }
      }

      // Gọi API để lấy thông tin building từ building_id
      // Thử dùng BUILDINGS_PATTERN.GET_BY_ID trước (nơi đã confirm có dữ liệu)
      const buildingResponse = await firstValueFrom(
        this.buildingsClient.send(BUILDINGS_PATTERN.GET_BY_ID, { buildingId: scheduleJob.buildingDetailId }).pipe(
          timeout(5000),
          catchError(err => {
            console.error(`[users.service] Error fetching building:`, err)
            throw new Error(`Lỗi khi lấy thông tin tòa nhà: ${err.message}`)
          })
        )
      )

      console.log(`[users.service] Building response:`, JSON.stringify(buildingResponse))

      // Kiểm tra xem có lấy được thông tin building không
      if (!buildingResponse) {
        return {
          isSuccess: false,
          message: `Không nhận được phản hồi khi tìm tòa nhà với ID: ${scheduleJob.buildingDetailId}`,
          isMatch: false
        }
      }

      // Kiểm tra response success theo cả hai loại cấu trúc có thể nhận được
      const responseSuccess =
        (buildingResponse.statusCode === 200) ||
        (buildingResponse.isSuccess === true)

      if (!responseSuccess || !buildingResponse.data) {
        return {
          isSuccess: false,
          message: `Không tìm thấy thông tin tòa nhà với ID: ${scheduleJob.buildingDetailId}`,
          isMatch: false
        }
      }

      // Lấy areaId từ thông tin building
      console.log(`[users.service] Building data:`, JSON.stringify(buildingResponse.data))

      // Truy cập areaId theo cả hai cấu trúc dữ liệu có thể có
      let areaId
      let areaName

      // Trích xuất dữ liệu từ các cấu trúc response khác nhau
      if (buildingResponse.data.areaId) {
        // Cấu trúc từ BUILDINGS_PATTERN.GET_BY_ID
        console.log('[users.service] Using direct building data structure')
        areaId = buildingResponse.data.areaId

        // Từ area object - cấu trúc đầy đủ
        if (buildingResponse.data.area && buildingResponse.data.area.name) {
          areaName = buildingResponse.data.area.name
        }
      }
      else if (buildingResponse.data.building && buildingResponse.data.building.area) {
        // Cấu trúc từ BUILDINGDETAIL_PATTERN.GET_BY_ID
        console.log('[users.service] Using buildingDetail data structure')
        areaId = buildingResponse.data.building.area.areaId
        areaName = buildingResponse.data.building.area.name
      }

      console.log(`[users.service] Extracted area information: areaId=${areaId}, areaName=${areaName}`)

      if (!areaId) {
        return {
          isSuccess: false,
          message: 'Không thể xác định khu vực của tòa nhà',
          isMatch: false
        }
      }

      // Từ areaId, gọi đến area service để lấy thông tin area nếu không có areaName
      if (!areaName) {
        console.log(`[users.service] Getting area info using areaId: ${areaId}`)

        try {
          // Gọi API để lấy thông tin area từ areaId
          const areaResponse = await firstValueFrom(
            this.buildingsClient.send(AREAS_PATTERN.GET_BY_ID, { areaId }).pipe(
              timeout(5000),
              catchError(err => {
                console.error(`[users.service] Error fetching area:`, err)
                throw new Error(`Lỗi khi lấy thông tin khu vực: ${err.message}`)
              })
            )
          )

          console.log(`[users.service] Area response:`, JSON.stringify(areaResponse))

          // Kiểm tra xem có lấy được thông tin area không
          if (!areaResponse || areaResponse.statusCode !== 200 || !areaResponse.data) {
            return {
              isSuccess: false,
              message: `Không tìm thấy thông tin khu vực với ID: ${areaId}`,
              isMatch: false
            }
          }

          // Lấy areaName từ thông tin area
          areaName = areaResponse.data.name
        } catch (error) {
          console.error(`[users.service] Error getting area name:`, error)
          return {
            isSuccess: false,
            message: `Lỗi khi lấy tên khu vực: ${error.message}`,
            isMatch: false
          }
        }
      }

      if (!areaName) {
        return {
          isSuccess: false,
          message: 'Khu vực không có tên',
          isMatch: false
        }
      }

      // Lấy area của staff từ department
      const staffAreaName = staff.userDetails.department.area

      console.log(`[users.service] Comparing areas: Staff area (${staffAreaName}) vs Building area (${areaName})`)

      // So sánh area của staff với area của building
      const isMatch = staffAreaName.toLowerCase() === areaName.toLowerCase()

      console.log(`[users.service] Area match result: ${isMatch ? 'MATCH' : 'NO MATCH'}`)

      return {
        isSuccess: true,
        message: isMatch
          ? `Nhân viên thuộc khu vực ${staffAreaName} phù hợp với khu vực ${areaName} của công việc`
          : `Nhân viên thuộc khu vực ${staffAreaName} không phù hợp với khu vực ${areaName} của công việc`,
        isMatch
      }
    } catch (error) {
      console.error(`[users.service] Error in checkStaffAreaMatchWithScheduleJob:`, error)
      return {
        isSuccess: false,
        message: `        Lỗi khi kiểm tra khu vực: ${error.message}`,
        isMatch: false
      }
    }
  }

  async getUserByIdForTaskAssignmentDetail(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { userId },
        select: {
          userId: true,
          username: true,
        },
      })

      if (!user) {
        return {
          isSuccess: false,
          message: 'User not found',
          data: null,
        }
      }

      return {
        isSuccess: true,
        message: 'User retrieved successfully',
        data: {
          userId: user.userId,
          username: user.username,
        },
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving user details',
      })
    }
  }

  /**
   * Check if a user exists with optional role validation
   * @param userId The user ID to check
   * @param role Optional role to validate against
   * @returns The user if found, null otherwise
   */
  async checkUserExists(userId: string, role?: string): Promise<any> {
    try {
      if (!userId) {
        return null
      }

      // Build the where clause
      const where: any = { userId }

      // If role is specified, add it to the query
      if (role) {
        where.role = role
      }

      // Find the user
      const user = await this.prisma.user.findFirst({
        where,
        select: {
          userId: true,
          role: true,
          username: true
        }
      })

      return user
    } catch (error) {
      console.error(`Error checking if user exists (userId: ${userId}, role: ${role}):`, error)
      return null
    }
  }
}
