import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../../../libs/contracts/src/ApiReponse/api-response';
import { UpdateInspectionDto } from '../../../libs/contracts/src/inspections/update-inspection.dto';
import { CreateInspectionDto } from '@app/contracts/inspections/create-inspection.dto';
import { Inspection } from '@prisma/client-Task';
import { ChangeInspectionStatusDto } from '@app/contracts/inspections/change-inspection-status.dto';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

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
        image_url: dto.image_url || null,
        description: dto.description || '',
        status: dto.status || 'Notyetverify',
        total_cost: dto.total_cost || 0,
        locationDetailId: dto.locationDetailId || "null",
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
}
