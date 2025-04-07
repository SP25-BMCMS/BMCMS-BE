import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';
import { UpdateInspectionDto } from '../../../libs/contracts/src/inspections/update-inspection.dto';
import { CreateInspectionDto } from '@app/contracts/inspections/create-inspection.dto';
import { Inspection } from '@prisma/client-Task';
import { ChangeInspectionStatusDto } from '@app/contracts/inspections/change-inspection-status.dto';
import { AddImageToInspectionDto } from '@app/contracts/inspections/add-image.dto';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, Observable, of, timeout } from 'rxjs';
import { IsUUID } from 'class-validator';

const USERS_CLIENT = 'USERS_CLIENT'
// Define interface for the User service
interface UserService {
  getUserInfo(data: UserRequest): Observable<any>;
  getWorkingPositionById(data: WorkingPositionByIdRequest): Observable<any>;
}

// Define matching interfaces cho proto
interface UserRequest {
  userId: string;
  username: string;
}

interface WorkingPositionByIdRequest {
  positionId: string;
}

// Định nghĩa CRACK_PATTERNS cho pattern get-crack-detail-by-id
const CRACK_PATTERNS = {
  GET_DETAILS: { cmd: 'get-crack-report-by-id' }
};

@Injectable()
export class InspectionsService implements OnModuleInit {
  private userService: UserService;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('CRACK_CLIENT') private readonly crackClient: ClientProxy,
    @Inject(USERS_CLIENT) private readonly userClient: ClientGrpc
  ) {

  }

  onModuleInit() {
    console.log('InspectionsService - onModuleInit called');

    // Kiểm tra xem userClient có được inject đúng không
    if (!this.userClient) {
      console.error('userClient is undefined in onModuleInit');
      return;
    }

    try {
      this.userService = this.userClient.getService<UserService>('UserService');
      console.log('userService initialized:', this.userService ? 'Successfully' : 'Failed');
    } catch (error) {
      console.error('Error initializing userService:', error);
    }
  }

  async GetInspectionByTaskAssignmentId(task_assignment_id: string) {
    try {
      const inspection = await this.prisma.inspection.findMany({
        where: { task_assignment_id },
      });
      if (inspection.length === 0) {
        return {
          statusCode: 404,
          message:
            'No inspections found for this task assignment id = ' +
            task_assignment_id,
        };
      }
      return {
        statusCode: 200,
        message: 'Inspections retrieved successfully',
        data: inspection,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving inspections for task assignment',
      });
    }
  }

  async updateInspection(inspection_id: string, dto: UpdateInspectionDto) {
    const existingInspection = await this.prisma.inspection.findUnique({
      where: { inspection_id },
    });

    if (!existingInspection) {
      throw new RpcException(
        new ApiResponse(false, 'Inspection không tồn tại'),
      );
    }

    try {
      const updatedInspection = await this.prisma.inspection.update({
        where: { inspection_id },
        data: { ...dto },
      });
      return new ApiResponse(true, 'Inspection đã được cập nhật thành công', [
        updatedInspection,
      ]);
    } catch (error) {
      throw new RpcException(new ApiResponse(false, 'Dữ liệu không hợp lệ'));
    }
  }

  // async GetInspectionByCrackId(crack_id: string) {
  //   try {
  //     const inspections = await this.prisma.inspection.findMany({
  //       where: { crack_id },
  //     });

  //     if (inspections.length === 0) {
  //       return {
  //         statusCode: 404,
  //         message: 'No inspections found for this crack id = ' + crack_id,
  //       };
  //     }

  //     return {
  //       statusCode: 200,
  //       message: 'Inspections retrieved successfully',
  //       data: inspections
  //     };
  //   } catch (error) {
  //     throw new RpcException({
  //       statusCode: 500,
  //       message: 'Error retrieving inspections for crack',
  //       error: error.message
  //     });
  //   }
  // }

  async GetAllInspections() {
    try {
      const inspections = await this.prisma.inspection.findMany({
        include: {
          taskAssignment: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (inspections.length === 0) {
        return {
          statusCode: 404,
          message: 'No inspections found',
          data: [],
        };
      }

      return {
        statusCode: 200,
        message: 'Inspections retrieved successfully',
        data: inspections,
        total: inspections.length,
      };
    } catch (error) {
      console.error('Error in GetAllInspections:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving inspections',
        error: error.message,
      });
    }
  }

  async createInspection(dto: CreateInspectionDto): Promise<ApiResponse<Inspection>> {
    try {
      // Check if task assignment exists
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: dto.task_assignment_id },
      });

      if (!taskAssignment) {
        return new ApiResponse(false, 'Task assignment not found', null);
      }

      // Ensure inspected_by is provided (this should always be set by the API Gateway from the token)
      if (!dto.inspected_by) {
        return new ApiResponse(false, 'User ID not provided in token', null);
      }

      // Verify that the user is a Staff
      const staffVerification = await this.verifyStaffRole(dto.inspected_by);
      if (!staffVerification.isSuccess) {
        return new ApiResponse(
          false,
          staffVerification.message,
          null
        );
      }

      // Create the inspection with the Staff's ID and uploaded image URLs
      const inspectionData = {
        task_assignment_id: dto.task_assignment_id,
        inspected_by: dto.inspected_by, // This is the authenticated Staff's ID from the token
        image_urls: dto.image_urls || [],
        description: dto.description || "",
        total_cost: dto.total_cost || 0,
      };

      // Log image URLs for debugging
      console.log('Creating inspection with image URLs:', dto.image_urls);

      const inspection = await this.prisma.inspection.create({
        data: inspectionData,
      });

      return new ApiResponse(true, 'Inspection created successfully', inspection);
    } catch (error) {
      return new ApiResponse(false, 'Error creating inspection', error.message);
    }
  }

  // async changeStatus(dto: ChangeInspectionStatusDto): Promise<ApiResponse<Inspection>> {
  //   try {
  //     const inspection = await this.prisma.inspection.findUnique({
  //       where: { inspection_id: dto.inspection_id },
  //     });

  //     if (!inspection) {
  //       return new ApiResponse(false, 'Inspection not found', null);
  //     }

  //     const updatedInspection = await this.prisma.inspection.update({
  //       where: { inspection_id: dto.inspection_id },
  //       data: { status: dto.status },
  //     });

  //     return new ApiResponse(true, 'Inspection status updated successfully', updatedInspection);
  //   } catch (error) {
  //     return new ApiResponse(false, 'Error updating inspection status', error.message);
  //   }
  // }

  async addImage(dto: AddImageToInspectionDto): Promise<ApiResponse<Inspection>> {
    try {
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id: dto.inspection_id },
      });

      if (!inspection) {
        return new ApiResponse(false, 'Inspection not found', null);
      }

      // Get current image_urls array or initialize as empty array
      const currentImageUrls = inspection.image_urls || [];

      // Add new images to the array
      const updatedImageUrls = [...currentImageUrls, ...dto.image_urls];

      const updatedInspection = await this.prisma.inspection.update({
        where: { inspection_id: dto.inspection_id },
        data: { image_urls: updatedImageUrls },
      });

      return new ApiResponse(true, 'Images added successfully', updatedInspection);
    } catch (error) {
      return new ApiResponse(false, 'Error adding images', error.message);
    }
  }

  async getInspectionDetails(inspection_id: string): Promise<ApiResponse<any>> {
    try {
      // 1. Get inspection with task assignment
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id },
        include: {
          taskAssignment: {
            include: {
              task: true
            }
          }
        }
      });

      if (!inspection) {
        return new ApiResponse(false, 'Inspection not found', null);
      }

      const result: any = { ...inspection };

      // 2. Get task info
      const task = inspection.taskAssignment.task;
      console.log(task);
      // 3. If crack_id exists, get crack info
      if (task.crack_id) {
        console.log("🚀 ~ InspectionsService ~ getInspectionDetails ~ task.crack_id:", task.crack_id)
        const crackInfo = await firstValueFrom(
          this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
        );
        result.crackInfo = crackInfo;
        console.log("🚀 ~ InspectionsService ~ getInspectionDetails ~ crackInfo:", crackInfo)
      }

      // 4. If schedule_id exists, get schedule info (you can add this later)
      if (task.schedule_job_id) {
        // Add schedule info retrieval here
      }

      return new ApiResponse(true, 'Inspection details retrieved successfully', result);
    } catch (error) {
      return new ApiResponse(false, 'Error retrieving inspection details', error.message);
    }
  }

  async getInspectionById(inspection_id: string): Promise<ApiResponse<any>> {
    try {
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id },
        include: {
          taskAssignment: {
            include: {
              task: true
            }
          },
          repairMaterials: true
        }
      });

      if (!inspection) {
        return new ApiResponse(false, 'Inspection not found', null);
      }

      return new ApiResponse(true, 'Inspection retrieved successfully', inspection);
    } catch (error) {
      console.error('Error retrieving inspection:', error);
      return new ApiResponse(false, 'Error retrieving inspection', error.message);
    }
  }

  /**
   * Get buildingDetailId from task_assignment_id by traversing the relations:
   * TaskAssignment -> Task -> call CrackService to get BuildingDetail
   */
  async getBuildingDetailIdFromTaskAssignment(task_assignment_id: string): Promise<ApiResponse<any>> {
    try {
      console.log(`Finding task assignment with ID: ${task_assignment_id}`);

      // First find the TaskAssignment
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: task_assignment_id },
        include: {
          task: true, // Include Task relation
        },
      });

      console.log('Task assignment found:', JSON.stringify(taskAssignment, null, 2));

      if (!taskAssignment || !taskAssignment.task) {
        console.log('TaskAssignment or Task not found:', task_assignment_id);
        return new ApiResponse(false, 'TaskAssignment or Task not found', null);
      }

      // Use the task_id to get the BuildingDetailId from Crack service
      const taskId = taskAssignment.task.task_id;
      console.log(`Using task_id: ${taskId} to get buildingDetailId`);
      console.log(`Task details: crack_id=${taskAssignment.task.crack_id}`);

      // Call the CRACK service to get buildingDetailId using task_id
      console.log(`Calling crack service with task_id=${taskId}`);
      const crackResponse = await firstValueFrom(
        this.crackClient.send(
          { cmd: 'get-buildingDetail-by-task-id' },
          { taskId }
        ).pipe(
          timeout(10000),
          catchError(err => {
            console.error('Error getting building detail by task ID:', err);
            return of({ isSuccess: false, data: null });
          })
        )
      );

      console.log('Crack service response:', JSON.stringify(crackResponse, null, 2));

      if (!crackResponse || !crackResponse.isSuccess || !crackResponse.data) {
        console.log('Failed to get building detail from crack service');
        return new ApiResponse(false, 'Failed to get building detail', null);
      }

      // Extract buildingDetailId from the response
      const buildingDetailId = crackResponse.data.buildingDetailId;

      if (!buildingDetailId) {
        console.log('BuildingDetailId not found in crack response');
        return new ApiResponse(false, 'BuildingDetailId not found', null);
      }

      console.log('Successfully retrieved buildingDetailId:', buildingDetailId);
      return new ApiResponse(true, 'BuildingDetailId retrieved successfully', { buildingDetailId });
    } catch (error) {
      console.error('Error in getBuildingDetailIdFromTaskAssignment:', error);
      return new ApiResponse(false, 'Error retrieving BuildingDetailId', null);
    }
  }

  async verifyStaffRole(userId: string): Promise<ApiResponse<boolean>> {
    try {
      console.log(`Tasks microservice - Verifying if user ${userId} is a Staff...`);

      // Ensure userService is initialized
      if (!this.userService) {
        console.log('userService is undefined, attempting to reinitialize');
        try {
          this.userService = this.userClient.getService<UserService>('UserService');
          console.log('userService reinitialized:', this.userService ? 'Successfully' : 'Failed');

          if (!this.userService) {
            console.error('userService still undefined after reinitialization attempt');
            return new ApiResponse(false, 'Failed to initialize user service - gRPC client may not be connected', false);
          }
        } catch (error) {
          console.error('Error reinitializing userService:', error);
          return new ApiResponse(false, `Error initializing service: ${error.message}`, false);
        }
      }

      // Test the gRPC connection by directly checking methods
      if (!this.userService.getUserInfo) {
        console.error('getUserInfo method is not available in userService');
        // Try to get available methods
        const methods = Object.keys(this.userService);
        console.log('Available methods in userService:', methods);
        return new ApiResponse(false, 'User service incorrectly initialized - getUserInfo not available', false);
      }

      // Get user details from User service using gRPC
      console.log('About to call getUserInfo with gRPC');
      let userInfo;
      try {
        userInfo = await firstValueFrom(
          this.userService.getUserInfo({ userId, username: '' } as UserRequest)
            .pipe(
              timeout(10000),
              catchError(err => {
                console.error('Error fetching user info in Tasks service:', err);
                return of(null);
              })
            )
        );
      } catch (error) {
        console.error('Critical error calling getUserInfo:', error);
        return new ApiResponse(false, `Error calling getUserInfo: ${error.message}`, false);
      }

      console.log('Tasks microservice - User info received:', JSON.stringify(userInfo, null, 2));

      if (!userInfo) {
        console.error('Tasks microservice - User info is null or undefined');
        return new ApiResponse(false, 'User not found', false);
      }

      // Check if user has role Staff
      const role = userInfo.role;
      console.log(`Tasks microservice - User role: ${role}`);

      if (role !== 'Staff') {
        console.log(`Tasks microservice - User role ${role} is not Staff`);
        return new ApiResponse(
          false,
          `Only Staff can create inspections. Current role: ${role}`,
          false
        );
      }

      console.log('Tasks microservice - User is a Staff, validation successful');
      return new ApiResponse(true, 'User is a Staff', true);
    } catch (error) {
      console.error('Tasks microservice - Error in verifyStaffRole:', error);
      return new ApiResponse(false, `Error validating user role: ${error.message}`, false);
    }
  }
}
