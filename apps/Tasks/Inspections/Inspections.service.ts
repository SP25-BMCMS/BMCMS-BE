import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';

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
          message: 'Task not found',
        };
      }
      return {
        statusCode: 200,
        message: 'Task retrieved successfully',
        data: inspection,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving task',
      });
    }
  }
}
