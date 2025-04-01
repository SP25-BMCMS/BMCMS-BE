import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from '../../../libs/contracts/src/users/user.dto';
import { createUserDto } from '../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';
import { Role, AccountStatus } from '@prisma/client-users';
import { CreateWorkingPositionDto } from '../../../libs/contracts/src/users/create-working-position.dto';
import { PositionName } from '@prisma/client-users';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';
import {
  catchError,
  firstValueFrom,
  of,
  retry,
  throwError,
  timeout,
} from 'rxjs';
import { BUILDINGS_PATTERN } from '../../../libs/contracts/src/buildings/buildings.patterns';
import { BUILDINGDETAIL_PATTERN } from '@app/contracts/BuildingDetails/buildingdetails.patterns';
import { AREAS_PATTERN } from '../../../libs/contracts/src/Areas/Areas.patterns';

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';
const CRACKS_CLIENT = 'CRACKS_CLIENT';
const CRACK_PATTERN = {
  GET_CRACK_REPORT: { cmd: 'get-crack-report-by-id' }
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(BUILDINGS_CLIENT) private readonly buildingClient: ClientProxy,
    @Inject(CRACKS_CLIENT) private readonly crackClient: ClientProxy,
  ) { }

  async getUserByUsername(username: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user)
      throw new RpcException({
        statusCode: 401,
        message: 'Sai số điện thoại hoặc mật khẩu',
      });
    return user;
  }

  async getUserByPhone(phone: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user)
      throw new RpcException({
        statusCode: 401,
        message: 'Sai số điện thoại hoặc mật khẩu',
      });
    return user;
  }

  async getUserByEmail(email: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      throw new RpcException({
        statusCode: 401,
        message: 'Email không tồn tại',
      });
    return user;
  }

  async getUserById(userId: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        userDetails: true,
        apartments: true,
      },
    });
    if (!user)
      throw new RpcException({
        statusCode: 401,
        message: 'invalid credentials!',
      });
    return user;
  }

  async signup(userData: createUserDto): Promise<ApiResponse<any>> {
    try {
      // Check if building exists for each apartment if user is a resident
      if (
        userData.role === Role.Resident &&
        userData.apartments &&
        userData.apartments.length > 0
      ) {
        console.log('Validating building IDs for resident apartments...');

        for (const apartment of userData.apartments) {
          try {
            console.log(`Checking building ID: ${apartment.buildingDetailId}`);

            const buildingResponse = await firstValueFrom(
              this.buildingClient
                .send(BUILDINGDETAIL_PATTERN.CHECK_EXISTS, {
                  buildingDetailId: apartment.buildingDetailId,
                })
                .pipe(
                  timeout(5000),
                  catchError((err) => {
                    console.error(
                      'Error communicating with building service:',
                      err,
                    );
                    throw new Error('Building service unavailable');
                  }),
                ),
            );

            console.log('Building service response:', buildingResponse);

            if (
              buildingResponse.statusCode === 404 ||
              !buildingResponse.exists
            ) {
              return new ApiResponse(
                false,
                `Building with ID ${apartment.buildingDetailId} not found`,
                null,
              );
            }
          } catch (error) {
            console.error('Error validating building:', error);
            return new ApiResponse(
              false,
              error.message || 'Error validating building',
              null,
            );
          }
        }
      }

      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ username: userData.username }, { email: userData.email }],
        },
      });

      if (existingUser) {
        return new ApiResponse(false, 'Username hoặc Email đã tồn tại', null);
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      let newUser;
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
        });
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
                    staffStatus: userData.staffStatus ?? null,
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
        });
      }

      // ✅ Truy vấn lại để lấy đầy đủ thông tin
      const fullUser = await this.prisma.user.findUnique({
        where: { userId: newUser.userId },
        include: {
          apartments: true,
          userDetails: true,
        },
      });

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
      });
    } catch (error) {
      console.error('🔥 Lỗi trong UsersService:', error);
      return new ApiResponse(false, 'Lỗi không xác định khi tạo user', null);
    }
  }

  async updateUser(
    userId: string,
    data: Partial<createUserDto>,
  ): Promise<UserDto> {
    const user = await this.getUserById(userId);
    if (!user)
      throw new RpcException({ statusCode: 404, message: 'User not found' });

    // Validate building IDs if apartments are being updated
    if (data.apartments && data.apartments.length > 0) {
      console.log('Validating building IDs for apartment updates...');

      for (const apartment of data.apartments) {
        try {
          console.log(`Checking building ID: ${apartment.buildingDetailId}`);

          const buildingResponse = await firstValueFrom(
            this.buildingClient
              .send(BUILDINGDETAIL_PATTERN.CHECK_EXISTS, {
                buildingDetailId: apartment.buildingDetailId,
              })
              .pipe(
                timeout(5000),
                catchError((err) => {
                  console.error(
                    'Error communicating with building service:',
                    err,
                  );
                  throw new RpcException({
                    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                    message: 'Building service unavailable',
                  });
                }),
              ),
          );

          if (buildingResponse.statusCode === 404 || !buildingResponse.exists) {
            throw new RpcException({
              statusCode: HttpStatus.NOT_FOUND,
              message: `Building with ID ${apartment.buildingDetailId} not found`,
            });
          }
        } catch (error) {
          if (error instanceof RpcException) {
            throw error;
          }
          throw new RpcException({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message || 'Error validating building',
          });
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
    };

    // Remove accountStatus from original data object to avoid type issues
    if (data.accountStatus) {
      delete data.accountStatus;
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
    });
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    await this.prisma.user.delete({ where: { userId } });
    return { message: 'User deleted successfully' };
  }

  async getAllUsers(): Promise<{ users: UserDto[] }> {
    const users = await this.prisma.user.findMany();
    return { users: users };
  }

  async createWorkingPosition(data: CreateWorkingPositionDto) {
    try {
      console.log('Received data:', data); // Debug dữ liệu nhận từ gRPC

      // Kiểm tra xem giá trị có hợp lệ hay không
      if (
        !Object.values(PositionName).includes(data.positionName as PositionName)
      ) {
        throw new Error(`Invalid positionName: ${data.positionName}`);
      }

      const newPosition = await this.prisma.workingPosition.create({
        data: {
          positionName: data.positionName as PositionName, // ✅ Chuyển string thành enum
          description: data.description,
        },
      });

      return {
        isSuccess: true,
        message: 'Working Position created successfully',
        data: {
          positionId: newPosition.positionId,
          positionName: newPosition.positionName.toString(), // ✅ Chuyển Enum thành chuỗi
          description: newPosition.description,
        },
      };
    } catch (error) {
      console.error('🔥 Error creating working position:', error);
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to create working position',
      });
    }
  }

  async getAllWorkingPositions(): Promise<{
    workingPositions: {
      positionId: string;
      positionName: PositionName;
      description?: string;
    }[];
  }> {
    try {
      const positions = await this.prisma.workingPosition.findMany();
      return {
        workingPositions: positions.map((position) => ({
          positionId: position.positionId,
          positionName: position.positionName,
          description: position.description,
        })),
      };
    } catch (error) {
      console.error('Error fetching working positions:', error);
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch working positions',
      });
    }
  }

  async getWorkingPositionById(data: { positionId: string }): Promise<{
    isSuccess: boolean;
    message: string;
    data: {
      positionId: string;
      positionName: PositionName;
      description?: string;
    } | null;
  }> {
    try {
      const position = await this.prisma.workingPosition.findUnique({
        where: { positionId: data.positionId },
      });

      if (!position) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Working Position not found',
        });
      }

      return {
        isSuccess: true,
        message: 'Working Position retrieved successfully',
        data: {
          positionId: position.positionId,
          positionName: position.positionName,
          description: position.description,
        },
      };
    } catch (error) {
      console.error('Error fetching working position:', error);
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to retrieve working position',
      });
    }
  }

  async deleteWorkingPosition(data: { positionId: string }): Promise<{
    isSuccess: boolean;
    message: string;
    data: {
      positionId: string;
      positionName: PositionName;
      description?: string;
    } | null;
  }> {
    try {
      const deletedPosition = await this.prisma.workingPosition.delete({
        where: { positionId: data.positionId },
      });

      return {
        isSuccess: true,
        message: 'Working Position deleted successfully',
        data: {
          positionId: deletedPosition.positionId,
          positionName: deletedPosition.positionName,
          description: deletedPosition.description,
        },
      };
    } catch (error) {
      console.error('Error deleting working position:', error);
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to delete working position',
      });
    }
  }

  async createDepartment(data: CreateDepartmentDto) {
    try {
      console.log(
        '📥 Checking if area exists in Building Microservice:',
        data.area,
      );

      const areaExistsResponse = await firstValueFrom(
        this.buildingClient
          .send('check_area_exists', { areaName: data.area })
          .pipe(
            timeout(5000),
            catchError((err) => {
              console.error('❌ Error contacting Building Microservice:', err);
              throw new RpcException({
                statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                message: 'Building Microservice is not responding',
              });
            }),
          ),
      );

      if (!areaExistsResponse.exists) {
        console.error(
          `❌ Area '${data.area}' does not exist in Building Microservice`,
        );
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Area '${data.area}' does not exist in Building Microservice`,
        });
      }

      console.log('✅ Area exists, creating Department...');

      const newDepartment = await this.prisma.department.create({
        data: {
          departmentName: data.departmentName,
          description: data.description,
          area: data.area,
        },
      });

      return {
        isSuccess: true,
        message: 'Department created successfully',
        data: {
          departmentId: newDepartment.departmentId,
          departmentName: newDepartment.departmentName,
          description: newDepartment.description,
          area: newDepartment.area,
        },
      };
    } catch (error) {
      console.error('🔥 Error creating department:', error);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Unexpected error creating department',
      });
    }
  }

  private async getBuildingDetails(buildingDetailId: string) {
    try {
      const response = await firstValueFrom(
        this.buildingClient
          .send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId })
          .pipe(
            timeout(5000),
            retry(2), // Retry 2 times before giving up
            catchError((err) => {
              console.error(
                `Error fetching buildingDetail ${buildingDetailId} after retries:`,
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
      console.error(`Failed to get buildingDetail ${buildingDetailId}:`, error);
      return {
        statusCode: 404,
        data: null,
      };
    }
  }

  async getApartmentsByResidentId(residentId: string): Promise<{
    isSuccess: boolean;
    message: string;
    data: {
      apartmentName: string;
      buildingDetails: any; // Thay thế 'any' bằng kiểu dữ liệu chính xác của building
    }[];
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          userId: residentId,
          role: Role.Resident,
        },
        include: { apartments: true },
      });

      if (!user) {
        return { isSuccess: false, message: 'Resident not found', data: [] };
      }

      // Xử lý các căn hộ của người dùng song song
      const apartmentPromises = user.apartments.map(async (apartment) => {
        const buildingResponse = await this.getBuildingDetails(
          apartment.buildingDetailId,
        );

        return {
          apartmentId: apartment.apartmentId,
          apartmentName: apartment.apartmentName,
          buildingDetails:
            buildingResponse?.statusCode === 200 ? buildingResponse.data : null,
        };
      });

      // Chờ tất cả các chi tiết căn hộ được lấy
      const apartmentsWithBuildings = await Promise.all(apartmentPromises);

      return {
        isSuccess: true,
        message: 'Success',
        data: apartmentsWithBuildings,
      };
    } catch (error) {
      return {
        isSuccess: false,
        message: 'Failed to retrieve apartments',
        data: [],
      };
    }
  }

  async getAllStaff(): Promise<{
    isSuccess: boolean;
    message: string;
    data: UserDto[];
  }> {
    try {
      const staffMembers = await this.prisma.user.findMany({
        where: {
          role: {
            in: [Role.Staff, Role.Admin, Role.Manager],
          },
        },
        include: {
          userDetails: {
            include: {
              position: true,
              department: true,
            },
          },
        },
      });

      if (!staffMembers || staffMembers.length === 0) {
        return { isSuccess: true, message: 'No staff members found', data: [] };
      }

      // Convert to user response format without exposing sensitive fields
      const staffData = staffMembers.map((staff) => {
        const { password, ...userWithoutPassword } = staff;
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
        };
      });

      return {
        isSuccess: true,
        message: 'Successfully retrieved all staff members',
        data: staffData as unknown as UserDto[],
      };
    } catch (error) {
      console.error('Error fetching staff members:', error);
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch staff members',
      });
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
      });

      if (!user) {
        return {
          isSuccess: false,
          message: 'Không tìm thấy cư dân',
          data: null
        };
      }

      // Check for duplicate apartments
      const existingApartments = user.apartments;
      const duplicateApartments = apartments.filter((newApt) =>
        existingApartments.some(
          (existingApt) =>
            existingApt.apartmentName === newApt.apartmentName &&
            existingApt.buildingDetailId === newApt.buildingDetailId,
        ),
      );

      if (duplicateApartments.length > 0) {
        const duplicateNames = duplicateApartments
          .map((apt) => apt.apartmentName)
          .join(', ');
        return {
          isSuccess: false,
          message: `Cư dân đã sở hữu các căn hộ sau: ${duplicateNames}`,
          data: null
        };
      }

      // Validate buildingDetail IDs
      for (const apartment of apartments) {
        try {
          const buildingResponse = await firstValueFrom(
            this.buildingClient
              .send(BUILDINGDETAIL_PATTERN.CHECK_EXISTS, {
                buildingDetailId: apartment.buildingDetailId,
              })
              .pipe(
                timeout(5000),
                catchError((err) => {
                  console.error('Error checking building:', err);
                  return of({
                    statusCode: 503,
                    message: 'Dịch vụ tòa nhà không phản hồi',
                    exists: false
                  });
                }),
              ),
          );

          if (!buildingResponse.exists) {
            return {
              isSuccess: false,
              message: `Không tìm thấy tòa nhà với ID ${apartment.buildingDetailId}`,
              data: null
            };
          }
        } catch (error) {
          console.error('Error validating building:', error);
          return {
            isSuccess: false,
            message: 'Lỗi khi kiểm tra thông tin tòa nhà',
            data: null
          };
        }
      }

      // Update apartments by adding new ones without deleting existing ones
      const updatedUser = await this.prisma.user.update({
        where: { userId: residentId },
        data: {
          apartments: {
            create: apartments,
          },
        },
        include: {
          apartments: true,
        },
      });

      return {
        isSuccess: true,
        message: 'Thêm căn hộ thành công',
        data: {
          userId: updatedUser.userId,
          username: updatedUser.username,
          apartments: updatedUser.apartments.map((apt) => ({
            apartmentName: apt.apartmentName,
            buildingDetailId: apt.buildingDetailId,
          })),
        },
      };
    } catch (error) {
      console.error('Error updating resident apartments:', error);
      return {
        isSuccess: false,
        message: 'Lỗi khi thêm căn hộ',
        data: null
      };
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
      });

      if (!user) {
        return {
          isSuccess: false,
          message: `Không tìm thấy người dùng với ID: ${userId}`,
          data: null,
        };
      }

      // Chuyển đổi accountStatus string thành enum
      const status =
        accountStatus === 'Active'
          ? AccountStatus.Active
          : AccountStatus.Inactive;

      // Cập nhật trạng thái tài khoản
      const updatedUser = await this.prisma.user.update({
        where: { userId },
        data: { accountStatus: status },
      });

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
      });

      // Format dữ liệu trả về theo dạng JSON phù hợp
      const formattedResponse = {
        accountStatus: fullUser.accountStatus,
      };

      return {
        isSuccess: true,
        message: `Cập nhật trạng thái tài khoản thành ${accountStatus}`,
        data: formattedResponse,
      };
    } catch (error) {
      console.error('Error updating account status:', error);
      return {
        isSuccess: false,
        message: `Lỗi khi cập nhật trạng thái tài khoản: ${error.message}`,
        data: null,
      };
    }
  }

  async getApartmentByResidentAndApartmentId(data: {
    residentId: string;
    apartmentId: string;
  }) {
    try {
      const apartment = await this.prisma.apartment.findFirst({
        where: {
          apartmentId: data.apartmentId,
          ownerId: data.residentId,
        },
      });

      if (!apartment) {
        return {
          isSuccess: false,
          message: 'Không tìm thấy căn hộ',
          data: null,
        };
      }

      // Get building details for this apartment
      const buildingResponse = await this.getBuildingDetails(
        apartment.buildingDetailId,
      );

      const formattedResponse = {
        apartmentId: apartment.apartmentId,
        apartmentName: apartment.apartmentName,
        buildingDetails: buildingResponse?.statusCode === 200 ? buildingResponse.data : null,
      };

      return {
        isSuccess: true,
        message: 'Success',
        data: formattedResponse,
      };
    } catch (error) {
      console.error('Error fetching apartment:', error);
      return {
        isSuccess: false,
        message: 'Failed to retrieve apartment',
        data: null,
      };
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
      });

      if (!staff || !staff.userDetails?.department) {
        return {
          isSuccess: false,
          message: 'Staff not found or no department assigned',
          isMatch: false
        };
      }

      // Get crack report info from crack service
      const crackReportResponse = await firstValueFrom(
        this.crackClient.send(CRACK_PATTERN.GET_CRACK_REPORT, crackReportId)
          .pipe(
            timeout(5000),
            catchError((err) => {
              console.error('Error getting crack report:', err);
              return of({ isSuccess: false, message: 'Error getting crack report', data: null });
            })
          )
      );

      if (!crackReportResponse || !crackReportResponse.isSuccess || !crackReportResponse.data || crackReportResponse.data.length === 0) {
        return {
          isSuccess: false,
          message: 'Crack report not found',
          isMatch: false
        };
      }

      const crackReport = crackReportResponse.data[0];

      // Get building details to get areaId
      const buildingResponse = await firstValueFrom(
        this.buildingClient.send(BUILDINGDETAIL_PATTERN.GET_BY_ID, { buildingDetailId: crackReport.buildingDetailId })
          .pipe(
            timeout(5000),
            catchError((err) => {
              console.error('Error getting building details:', err);
              return of({ statusCode: 404, data: null });
            })
          )
      );

      if (!buildingResponse || buildingResponse.statusCode !== 200) {
        return {
          isSuccess: false,
          message: 'Building not found',
          isMatch: false
        };
      }

      // Get area details to get area name
      const areaResponse = await firstValueFrom(
        this.buildingClient.send(AREAS_PATTERN.GET_BY_ID, { areaId: buildingResponse.data.building.area.areaId })
          .pipe(
            timeout(5000),
            catchError((err) => {
              return of({ statusCode: 404, data: null });
            })
          )
      );

      if (!areaResponse || areaResponse.statusCode !== 200) {
        return {
          isSuccess: false,
          message: 'Area not found',
          isMatch: false
        };
      }

      const buildingAreaName = areaResponse.data.name;

      // Check if staff's department area matches building's area name
      const isMatch = staff.userDetails.department.area === buildingAreaName;

      return {
        isSuccess: true,
        message: isMatch ? 'Area match found' : 'Area mismatch',
        isMatch
      };
    } catch (error) {
      return {
        isSuccess: false,
        message: 'Error checking area match',
        isMatch: false
      };
    }
  }
}
