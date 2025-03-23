// Định nghĩa interface cho tham số đầu vào phân trang
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Định nghĩa generic response type cho kết quả phân trang
export class PaginationResponseDto<T> {
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
    limit: number = 10
  ) {
    this.data = data;
    this.pagination = {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
} 