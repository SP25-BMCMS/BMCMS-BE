import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { BUILDINGDETAIL_PATTERN } from '../../../libs/contracts/src/BuildingDetails/buildingdetails.patterns';
import { SCHEDULES_PATTERN } from '../../../libs/contracts/src/schedules/Schedule.patterns';
import { SCHEDULEJOB_PATTERN } from '../../../libs/contracts/src/schedulesjob/ScheduleJob.patterns';

@Injectable()
export class EmployeesService {
  private crackClient: ClientProxy;
  private buildingClient: ClientProxy;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('BUILDINGS_CLIENT') private buildingsClient: ClientProxy,
    @Inject('CRACKS_CLIENT') private cracksClient: ClientProxy,
    @Inject('SCHEDULES_CLIENT') private schedulesClient: ClientProxy,
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
          message: 'Không tìm thấy nhân viên nào',
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
        message: 'Lấy danh sách nhân viên thành công',
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
        message: error.message || 'Không thể lấy danh sách nhân viên',
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
          message: 'Không tìm thấy trưởng nhóm hoặc người này không phải là trưởng nhóm',
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
          userId: {
            not: staffId
          },
          user: {
            role: 'Staff'
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
        message: 'Lấy danh sách nhân viên dưới quyền trưởng nhóm thành công',
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
        message: 'Không thể lấy danh sách nhân viên',
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

      // Validate crackReportId
      if (!crackReportId) {
        return {
          isSuccess: false,
          message: 'Mã báo cáo nứt không hợp lệ',
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      let areaName = null;

      try {
        // Step 1: Get crack report from the cracks service to find buildingDetailId
        console.log(`Sending request to get crack report with ID: ${crackReportId}`);
        const crackResponse = await this.cracksClient.send(
          { cmd: 'get-crack-report-by-id' },
          crackReportId
        ).toPromise();

        console.log('Crack report service response:', JSON.stringify(crackResponse, null, 2));

        // Check if we got a valid response
        if (!crackResponse || !crackResponse.isSuccess) {
          return {
            isSuccess: false,
            message: crackResponse?.message || `Không tìm thấy báo cáo nứt với ID ${crackReportId}`,
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        // Extract the crack report data
        const crackReport = crackResponse.data;
        if (!crackReport) {
          console.log(`Crack report data missing in response for ID ${crackReportId}`);
          return {
            isSuccess: false,
            message: `Không tìm thấy dữ liệu báo cáo nứt`,
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        console.log('Crack report data:', JSON.stringify(crackReport, null, 2));

        // Get the buildingDetailId - check multiple possible property names and locations
        let buildingDetailId = null;

        // Try different possible property names and nested structures
        if (crackReport.buildingDetailId) {
          buildingDetailId = crackReport.buildingDetailId;
        } else if (crackReport.building_detail_id) {
          buildingDetailId = crackReport.building_detail_id;
        } else if (crackReport.buildingDetail?.id) {
          buildingDetailId = crackReport.buildingDetail.id;
        } else if (crackReport.buildingDetail?.buildingDetailId) {
          buildingDetailId = crackReport.buildingDetail.buildingDetailId;
        } else if (crackReport.building?.detailId) {
          buildingDetailId = crackReport.building.detailId;
        } else if (crackReport.locationDetail?.buildingDetailId) {
          buildingDetailId = crackReport.locationDetail.buildingDetailId;
        } else if (typeof crackReport.location === 'string') {
          // Sometimes location might be the buildingDetailId directly
          buildingDetailId = crackReport.location;
        } else if (crackReport.location?.id) {
          buildingDetailId = crackReport.location.id;
        }

        // If we're dealing with an array, it could be the first element
        if (Array.isArray(crackReport) && crackReport.length > 0) {
          const firstItem = crackReport[0];
          if (firstItem.buildingDetailId) {
            buildingDetailId = firstItem.buildingDetailId;
          } else if (firstItem.building_detail_id) {
            buildingDetailId = firstItem.building_detail_id;
          }
        }

        if (!buildingDetailId) {
          console.log('buildingDetailId is missing in the crack report. Full response:', JSON.stringify(crackReport, null, 2));
          return {
            isSuccess: false,
            message: 'Không thể xác định khu vực tòa nhà từ báo cáo nứt này. Thiếu thông tin chi tiết tòa nhà.',
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        console.log(`Found buildingDetailId: ${buildingDetailId}`);

        // Step 2: Get building detail to find building ID and area
        console.log(`Sending request to get building detail with ID: ${buildingDetailId}`);
        const buildingDetailResponse = await this.buildingsClient.send(
          BUILDINGDETAIL_PATTERN.GET_BY_ID,
          { buildingDetailId }
        ).toPromise();

        console.log('Building detail response:', JSON.stringify(buildingDetailResponse, null, 2));

        // Check if we got a valid building detail response
        if (!buildingDetailResponse || buildingDetailResponse.statusCode !== 200) {
          return {
            isSuccess: false,
            message: buildingDetailResponse?.message || `Không tìm thấy thông tin chi tiết tòa nhà cho báo cáo nứt này`,
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        // Extract building and area info
        const buildingDetail = buildingDetailResponse.data;
        if (!buildingDetail || !buildingDetail.building || !buildingDetail.building.area) {
          console.log('Area information missing in building detail response');
          return {
            isSuccess: false,
            message: 'Thông tin khu vực không có sẵn cho tòa nhà này',
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        // Get the area name
        areaName = buildingDetail.building.area.name;
        console.log(`Found area name: ${areaName}`);

        if (!areaName) {
          console.log('Area name is missing');
          return {
            isSuccess: false,
            message: 'Tên khu vực không có sẵn cho tòa nhà này',
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

      } catch (error) {
        console.error('Error communicating with other services:', error);
        return {
          isSuccess: false,
          message: "Không thể lấy thông tin báo cáo vết nứt do lỗi cấu hình.",
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      // Step 3: Find staff leaders in this area
      console.log(`Finding staff leaders in area: ${areaName}`);
      const staffLeaders = await this.prisma.user.findMany({
        where: {
          role: 'Staff',
          userDetails: {
            position: {
              positionName: 'Leader'
            },
            department: {
              area: areaName
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
          message: `Không tìm thấy trưởng nhóm nào trong khu vực: ${areaName}`,
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      // Transform staff data for the response
      const staffData = staffLeaders.map((staff) => {
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
        message: `Lấy danh sách trưởng nhóm trong khu vực: ${areaName} thành công`,
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
        message: 'Không thể lấy danh sách trưởng nhóm. Đã xảy ra lỗi cơ sở dữ liệu.',
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

      // Validate scheduleJobId
      if (!scheduleJobId) {
        return {
          isSuccess: false,
          message: 'Mã công việc lịch trình không hợp lệ',
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      let areaName = null;

      try {
        // Step 1: Get schedule job from the schedules service to find buildingDetailId
        console.log(`Sending request to get schedule job with ID: ${scheduleJobId}`);
        const scheduleResponse = await this.schedulesClient.send(
          SCHEDULEJOB_PATTERN.GET_BY_ID,
          { schedule_job_id: scheduleJobId }
        ).toPromise();

        console.log('Schedule job service response:', JSON.stringify(scheduleResponse, null, 2));

        // Check if we got a valid response
        if (!scheduleResponse || !scheduleResponse.isSuccess) {
          return {
            isSuccess: false,
            message: scheduleResponse?.message || `Không tìm thấy công việc lịch trình với ID ${scheduleJobId}`,
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        // Extract the schedule job data
        const scheduleJob = scheduleResponse.data;
        if (!scheduleJob) {
          console.log(`Schedule job data missing in response for ID ${scheduleJobId}`);
          return {
            isSuccess: false,
            message: `Không tìm thấy dữ liệu công việc lịch trình`,
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        // Get the buildingDetailId
        const buildingDetailId = scheduleJob.buildingDetailId || scheduleJob.building_id;
        if (!buildingDetailId) {
          console.log('buildingDetailId is missing in the schedule job');
          return {
            isSuccess: false,
            message: 'Không thể xác định khu vực tòa nhà từ công việc lịch trình này',
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        // Step 2: Get building detail to find building ID and area
        console.log(`Sending request to get building detail with ID: ${buildingDetailId}`);
        const buildingDetailResponse = await this.buildingsClient.send(
          BUILDINGDETAIL_PATTERN.GET_BY_ID,
          { buildingDetailId }
        ).toPromise();

        console.log('Building detail response:', JSON.stringify(buildingDetailResponse, null, 2));

        // Check if we got a valid building detail response
        if (!buildingDetailResponse || buildingDetailResponse.statusCode !== 200) {
          return {
            isSuccess: false,
            message: buildingDetailResponse?.message || `Không tìm thấy thông tin chi tiết tòa nhà cho công việc lịch trình này`,
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        // Extract building and area info
        const buildingDetail = buildingDetailResponse.data;
        if (!buildingDetail || !buildingDetail.building || !buildingDetail.building.area) {
          console.log('Area information missing in building detail response');
          return {
            isSuccess: false,
            message: 'Thông tin khu vực không có sẵn cho tòa nhà này',
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

        // Get the area name
        areaName = buildingDetail.building.area.name;
        console.log(`Found area name: ${areaName}`);

        if (!areaName) {
          console.log('Area name is missing');
          return {
            isSuccess: false,
            message: 'Tên khu vực không có sẵn cho tòa nhà này',
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          };
        }

      } catch (error) {
        console.error('Error communicating with other services:', error);
        return {
          isSuccess: false,
          message: "Không thể lấy thông tin lịch trình.",
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      // Step 3: Find staff leaders in this area
      console.log(`Finding staff leaders in area: ${areaName}`);
      const staffLeaders = await this.prisma.user.findMany({
        where: {
          role: 'Staff',
          userDetails: {
            position: {
              positionName: 'Leader'
            },
            department: {
              area: areaName
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
          message: `Không tìm thấy trưởng nhóm nào trong khu vực: ${areaName}`,
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }

      // Transform staff data for the response
      const staffData = staffLeaders.map((staff) => {
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
        message: `Lấy danh sách trưởng nhóm trong khu vực: ${areaName} thành công`,
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
        message: 'Không thể lấy danh sách trưởng nhóm. Đã xảy ra lỗi cơ sở dữ liệu.',
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
    return `Hành động này trả về tất cả nhân viên`;
  }

  findOne(id: number) {
    return `Hành động này trả về nhân viên #${id}`;
  }

  remove(id: number) {
    return `Hành động này xóa nhân viên #${id}`;
  }
}
