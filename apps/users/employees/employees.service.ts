import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { BUILDINGDETAIL_PATTERN } from '../../../libs/contracts/src/BuildingDetails/buildingdetails.patterns';

@Injectable()
export class EmployeesService {
  private crackClient: ClientProxy;
  private buildingClient: ClientProxy;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('BUILDINGS_CLIENT') private buildingsClient: ClientProxy,
    @Inject('CRACKS_CLIENT') private cracksClient: ClientProxy,
  ) {
  }

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

  async getStaffLeaderByCrackReport(crackReportId: string) {
    try {
      console.log('Received gRPC request for getStaffLeaderByCrackReport:', crackReportId);

      // Bước 1: Lấy buildingDetailId từ crackReport thông qua RabbitMQ
      let areaName = null;
      try {
        // Gửi message đến Crack service để lấy buildingDetailId
        const crackResponse = await this.cracksClient.send(
          { cmd: 'get-crack-report-by-id' },
          crackReportId
        ).toPromise();

        console.log('Crack service response:', JSON.stringify(crackResponse, null, 2));

        if (crackResponse && crackResponse.isSuccess && crackResponse.data) {
          // Xử lý nếu data là một array
          const crackReportData = Array.isArray(crackResponse.data) ? crackResponse.data[0] : crackResponse.data;

          if (crackReportData) {
            const buildingDetailId = crackReportData.buildingDetailId;

            if (!buildingDetailId) {
              console.log('buildingDetailId is missing in the response data');
              // Tiếp tục với việc trả về tất cả leaders mà không lọc
            } else {
              console.log(`Found buildingDetailId: ${buildingDetailId} for crackReportId: ${crackReportId}`);

              // Bước 2: Lấy area từ buildingDetail thông qua RabbitMQ
              const buildingResponse = await this.buildingsClient.send(
                BUILDINGDETAIL_PATTERN.GET_BY_ID,
                { buildingDetailId }
              ).toPromise();

              console.log('Building service response:', JSON.stringify(buildingResponse, null, 2));

              if (buildingResponse && buildingResponse.statusCode === 200 && buildingResponse.data) {
                areaName = buildingResponse.data.building?.area?.name;
                console.log(`Found area: ${areaName} for buildingDetailId: ${buildingDetailId}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error communicating with other services:', error);
        // Tiếp tục chạy nếu có lỗi, trả về tất cả staff leader
      }

      // Bước 3: Lấy tất cả staff leader
      const staffLeaders = await this.prisma.user.findMany({
        where: {
          role: 'Staff',
          userDetails: {
            position: {
              positionName: 'Leader'
            }
          }
        },
        include: {
          userDetails: {
            include: {
              position: true,
              department: true
            }
          }
        }
      });

      if (!staffLeaders || staffLeaders.length === 0) {
        return {
          isSuccess: false,
          message: 'No staff leaders found',
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      // Bước 4: Lọc staff leader theo area nếu đã tìm được area
      let filteredStaff = staffLeaders;
      if (areaName) {
        console.log(`Filtering staff leaders by area: ${areaName}`);
        filteredStaff = staffLeaders.filter(staff => {
          const staffArea = staff.userDetails?.department?.area;
          console.log(`Staff ${staff.username} has area: ${staffArea}`);
          return staffArea === areaName;
        });

        // Nếu không tìm thấy staff leader trong area đó, trả về thông báo
        if (filteredStaff.length === 0) {
          return {
            isSuccess: false,
            message: `No staff leaders found for area: ${areaName}`,
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

      // Transform staff data for the response
      const staffData = filteredStaff.map((staff) => {
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
        message: areaName
          ? `Successfully retrieved staff leaders for area: ${areaName}`
          : 'Successfully retrieved all staff leaders (area filtering unavailable)',
        data: staffData,
        pagination: {
          total: staffData.length,
          page: 1,
          limit: staffData.length,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Error in getStaffLeaderByCrackReport:', error);
      return {
        isSuccess: false,
        message: error.message || 'Failed to retrieve staff leaders',
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

  async getStaffLeaderByScheduleJob(scheduleJobId: string) {
    try {
      console.log('Received gRPC request for getStaffLeaderByScheduleJob:', scheduleJobId);

      // Bước 1: Lấy buildingDetailId từ scheduleJob thông qua RabbitMQ
      let areaName = null;
      try {
        // Gửi message đến Schedule service để lấy buildingDetailId
        const scheduleResponse = await this.buildingsClient.send(
          { cmd: 'get-schedule-job-by-id' },
          scheduleJobId
        ).toPromise();

        console.log('Schedule service response:', JSON.stringify(scheduleResponse, null, 2));

        if (scheduleResponse && scheduleResponse.isSuccess && scheduleResponse.data) {
          // Xử lý nếu data là một array
          const scheduleJobData = Array.isArray(scheduleResponse.data) ? scheduleResponse.data[0] : scheduleResponse.data;

          if (scheduleJobData) {
            const buildingDetailId = scheduleJobData.buildingDetailId;

            if (!buildingDetailId) {
              console.log('buildingDetailId is missing in the response data');
              // Tiếp tục với việc trả về tất cả leaders mà không lọc
            } else {
              console.log(`Found buildingDetailId: ${buildingDetailId} for scheduleJobId: ${scheduleJobId}`);

              // Bước 2: Lấy area từ buildingDetail thông qua RabbitMQ
              const buildingResponse = await this.buildingsClient.send(
                BUILDINGDETAIL_PATTERN.GET_BY_ID,
                { buildingDetailId }
              ).toPromise();

              console.log('Building service response:', JSON.stringify(buildingResponse, null, 2));

              if (buildingResponse && buildingResponse.statusCode === 200 && buildingResponse.data) {
                areaName = buildingResponse.data.building?.area?.name;
                console.log(`Found area: ${areaName} for buildingDetailId: ${buildingDetailId}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error communicating with other services:', error);
        // Tiếp tục chạy nếu có lỗi, trả về tất cả staff leader
      }

      // Bước 3: Lấy tất cả staff leader
      const staffLeaders = await this.prisma.user.findMany({
        where: {
          role: 'Staff',
          userDetails: {
            position: {
              positionName: 'Leader'
            }
          }
        },
        include: {
          userDetails: {
            include: {
              position: true,
              department: true
            }
          }
        }
      });

      if (!staffLeaders || staffLeaders.length === 0) {
        return {
          isSuccess: false,
          message: 'No staff leaders found',
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      // Bước 4: Lọc staff leader theo area nếu đã tìm được area
      let filteredStaff = staffLeaders;
      if (areaName) {
        console.log(`Filtering staff leaders by area: ${areaName}`);
        filteredStaff = staffLeaders.filter(staff => {
          const staffArea = staff.userDetails?.department?.area;
          console.log(`Staff ${staff.username} has area: ${staffArea}`);
          return staffArea === areaName;
        });

        // Nếu không tìm thấy staff leader trong area đó, trả về thông báo
        if (filteredStaff.length === 0) {
          return {
            isSuccess: false,
            message: `No staff leaders found for area: ${areaName}`,
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

      // Transform staff data for the response
      const staffData = filteredStaff.map((staff) => {
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
        message: areaName
          ? `Successfully retrieved staff leaders for area: ${areaName}`
          : 'Successfully retrieved all staff leaders (area filtering unavailable)',
        data: staffData,
        pagination: {
          total: staffData.length,
          page: 1,
          limit: staffData.length,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Error in getStaffLeaderByScheduleJob:', error);
      return {
        isSuccess: false,
        message: error.message || 'Failed to retrieve staff leaders',
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
