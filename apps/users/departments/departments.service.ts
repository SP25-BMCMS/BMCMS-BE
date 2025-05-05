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
        'Lấy tất cả phòng ban thành công',
        departments
      )
    } catch (error) {
      return new ApiResponse(
        false,
        'Không thể lấy danh sách phòng ban',
        null
      )
    }
  }

}
