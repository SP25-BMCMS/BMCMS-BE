import { ApiProperty } from '@nestjs/swagger';
import { AssignmentStatus, Status } from '@prisma/client-Task';

// Convert interface to class for Swagger compatibility
export class PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string | string[];
  statusFilter?: string;
}

// Định nghĩa generic response type cho kết quả phân trang
export class PaginationResponseDto<T> {
  statusCode?: number;
  message?: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(
    data: T[],
    total: number,
    page: number = 1,
    limit: number = 10,
    statusCode: number = 200,
    message: string = 'Data retrieved successfully'
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.pagination = {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
} 