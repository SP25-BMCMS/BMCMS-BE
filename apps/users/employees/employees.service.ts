import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async getAllStaff(paginationParams: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string[];
  } = {}) {
    try {
      const { page = 1, limit = 10, search, role } = paginationParams;

      // Build where clause for filtering
      let whereClause: any = {
        role: {
          in: role || ['Staff', 'Admin', 'Manager']
        }
      };

      // Add search filter if provided
      if (search) {
        whereClause.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Count total matching records
      const totalCount = await this.prisma.user.count({
        where: whereClause
      });

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
      });

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
        };
      }

      // Transform staff data
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
                  positionName: staff.userDetails.position.positionName.toString(),
                  description: staff.userDetails.position.description || '',
                }
                : null,
              department: staff.userDetails.department
                ? {
                  departmentId: staff.userDetails.department.departmentId,
                  departmentName: staff.userDetails.department.departmentName,
                  description: staff.userDetails.department.description || '',
                  area: staff.userDetails.department.area || '',
                }
                : null,
            }
            : null,
        };
      });

      return {
        isSuccess: true,
        message: 'Successfully retrieved staff members',
        data: staffData,
        pagination: {
          total: totalCount,
          page: page,
          limit: limit,
          totalPages: Math.max(1, Math.ceil(totalCount / limit))
        }
      };
    } catch (error) {
      return {
        isSuccess: false,
        message: error.message || 'Failed to retrieve staff members',
        data: [],
        pagination: {
          total: 0,
          page: paginationParams.page || 1,
          limit: paginationParams.limit || 10,
          totalPages: 0
        }
      };
    }
  }

  async getAllStaffByStaffLeader(staffId: string) {
    try {
      // First get the staff leader's details
      const staffLeader = await this.prisma.userDetails.findFirst({
        where: {
          userId: staffId,
          position: {
            positionName: 'Leader'
          }
        },
        include: {
          department: true
        }
      });

      if (!staffLeader) {
        return {
          isSuccess: false,
          message: 'Staff leader not found or not a leader',
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      // Get all staff members in the same area
      const staffMembers = await this.prisma.userDetails.findMany({
        where: {
          department: {
            area: staffLeader.department.area
          },
          position: {
            positionName: {
              in: ['Technician', 'Janitor']
            }
          }
        },
        include: {
          user: true,
          position: true,
          department: true
        }
      });

      // Transform the data to match the expected response format
      const transformedData = staffMembers.map(staff => ({
        userId: staff.userId,
        username: staff.user.username,
        email: staff.user.email,
        phone: staff.user.phone,
        role: staff.user.role,
        dateOfBirth: staff.user.dateOfBirth,
        gender: staff.user.gender,
        accountStatus: staff.user.accountStatus,
        userDetails: {
          position: {
            positionId: staff.positionId,
            positionName: staff.position.positionName,
            description: staff.position.description
          },
          department: {
            departmentId: staff.departmentId,
            departmentName: staff.department.departmentName,
            description: staff.department.description,
            area: staff.department.area
          }
        }
      }));

      return {
        isSuccess: true,
        message: 'Successfully retrieved staff members under leader',
        data: transformedData,
        pagination: {
          total: transformedData.length,
          page: 1,
          limit: transformedData.length,
          totalPages: 1
        }
      };
    } catch (error) {
      return {
        isSuccess: false,
        message: 'Failed to retrieve staff members',
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

  findAll() {
    return `This action returns all employees`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employee`;
  }

  remove(id: number) {
    return `This action removes a #${id} employee`;
  }
}
