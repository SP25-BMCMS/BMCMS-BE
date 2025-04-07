import { Injectable, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';
import { UpdateInspectionDto } from '../../../libs/contracts/src/inspections/update-inspection.dto';
import { CreateInspectionDto } from '@app/contracts/inspections/create-inspection.dto';
import { Inspection } from '@prisma/client-Task';
import { ChangeInspectionStatusDto } from '@app/contracts/inspections/change-inspection-status.dto';
import { AddImageToInspectionDto } from '@app/contracts/inspections/add-image.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IsUUID } from 'class-validator';

// Định nghĩa CRACK_PATTERNS cho pattern get-crack-detail-by-id
const CRACK_PATTERNS = {
  GET_DETAILS: { cmd: 'get-crack-report-by-id' }
};

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('CRACK_CLIENT') private readonly crackClient: ClientProxy
  ) {}

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

      const inspectionData = {
        task_assignment_id: dto.task_assignment_id,
        inspected_by: dto.inspected_by,
        image_urls: dto.image_urls || [],
        description: dto.description || "",
        status: dto.status || 'Notyetverify',
        total_cost: dto.total_cost || 0,

      };

      const inspection = await this.prisma.inspection.create({
        data: inspectionData,
      });

      return new ApiResponse(true, 'Inspection created successfully', inspection);
    } catch (error) {
      return new ApiResponse(false, 'Error creating inspection', error.message);
    }
  }

  async changeStatus(dto: ChangeInspectionStatusDto): Promise<ApiResponse<Inspection>> {
    try {
      const inspection = await this.prisma.inspection.findUnique({
        where: { inspection_id: dto.inspection_id },
      });

      if (!inspection) {
        return new ApiResponse(false, 'Inspection not found', null);
      }

      const updatedInspection = await this.prisma.inspection.update({
        where: { inspection_id: dto.inspection_id },
        data: { status: dto.status },
      });

      return new ApiResponse(true, 'Inspection status updated successfully', updatedInspection);
    } catch (error) {
      return new ApiResponse(false, 'Error updating inspection status', error.message);
    }
  }

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
}
