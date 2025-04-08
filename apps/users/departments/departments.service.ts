import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ApiResponse } from '@app/contracts/ApiResponse/api-response'

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    try {
      const departments = await this.prisma.department.findMany({
        orderBy: {
          departmentName: 'asc'
        }
      })

      return new ApiResponse(
        true,
        'All departments retrieved successfully',
        departments
      )
    } catch (error) {
      return new ApiResponse(
        false,
        'Failed to retrieve departments',
        null
      )
    }
  }

}
