import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientGrpc, ClientProxy, RpcException } from '@nestjs/microservices'
import { AssignmentStatus, PrismaClient } from '@prisma/client-Task'
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto'
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment'
import { PrismaService } from '../../users/prisma/prisma.service'
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto'
import { ApiResponse } from '@nestjs/swagger'
import { firstValueFrom, Observable, of } from 'rxjs'
import { ConfigService } from '@nestjs/config'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import * as https from 'https'
import axios from 'axios'
import { catchError } from 'rxjs/operators'
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns'
import { NotificationType } from '@app/contracts/notifications/notification.dto'
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns'
const PDFDocument = require('pdfkit')
const CRACK_PATTERNS = {
  GET_DETAILS: { cmd: 'get-crack-report-by-id' }
}

interface UserService {
  GetUserByIdForTaskAssignmentDetail(data: { userId: string }): Observable<{
    isSuccess: boolean
    message: string
    data: {
      userId: string
      username: string
    }
  }>
}

@Injectable()
export class TaskAssignmentsService {
  private prisma = new PrismaClient();
  private userService: UserService
  private s3: S3Client
  private bucketName: string
  private readonly logger = new Logger(TaskAssignmentsService.name);

  private urlCache: Map<string, { url: string, expiry: number }> = new Map();

  constructor(
    @Inject('USERS_CLIENT') private readonly usersClient: ClientGrpc,
    @Inject('CRACK_CLIENT') private readonly crackClient: ClientProxy,
    @Inject('NOTIFICATION_CLIENT') private readonly notificationsClient: ClientProxy,
    @Inject('BUILDINGS_CLIENT') private readonly buildingsClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {
    this.userService = this.usersClient.getService<UserService>('UserService')

    // Initialize S3 client
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    })
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET')
  }

  // Hàm trích xuất file key từ URL
  private extractFileKey(urlString: string): string {
    try {
      const url = new URL(urlString)
      return url.pathname.substring(1) // Bỏ dấu '/' đầu tiên
    } catch (error) {
      console.error('URL không hợp lệ:', urlString)
      throw new Error('Định dạng URL không đúng')
    }
  }

  // Hàm tạo presigned URL
  async getPreSignedUrl(fileKey: string): Promise<string> {
    try {
      // Kiểm tra cache trước
      const cachedItem = this.urlCache.get(fileKey)
      if (cachedItem && Date.now() < cachedItem.expiry) {
        return cachedItem.url
      }

      // Nếu không có trong cache hoặc hết hạn, tạo URL mới
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      })

      // Giảm thời gian hết hạn để URL ngắn hơn
      const expiresIn = 3600 // Tăng lên 1 giờ để đảm bảo URL không hết hạn quá sớm
      const url = await getSignedUrl(this.s3, command, { expiresIn })

      // Lưu vào cache
      this.urlCache.set(fileKey, {
        url,
        expiry: Date.now() + (expiresIn * 1000) - 300000 // Để trước 5 phút hết hạn để đảm bảo
      })

      return url
    } catch (error) {
      console.error(`Error generating presigned URL for ${fileKey}:`, error.message)
      // Trả về null để xử lý ở phía gọi hàm
      return null
    }
  }

  /**
   * Generate fresh presigned URL for an S3 object
   * @param imageUrl Original S3 URL (can be expired)
   * @returns Fresh presigned URL
   */
  private async refreshPresignedUrl(imageUrl: string): Promise<string> {
    try {
      // Loại bỏ console.log không cần thiết và tối ưu hóa quá trình

      // Clean URL if enclosed in curly braces
      let cleanUrl = imageUrl
      if (imageUrl.startsWith('{') && imageUrl.endsWith('}')) {
        cleanUrl = imageUrl.substring(1, imageUrl.length - 1)
      }

      // Parse the URL to extract the S3 path
      const urlObj = new URL(cleanUrl)
      const path = urlObj.pathname.substring(1) // Remove leading slash

      // Create a new presigned URL - không log ra
      return await this.getPreSignedUrl(path)
    } catch (error) {
      // Return original URL if we can't refresh it
      return imageUrl
    }
  }

  // Helper method to parse multiple image URLs from a single string
  private parseImageUrls(imageUrlString: string): string[] {
    try {
      // Remove curly braces if present
      let cleanUrlString = imageUrlString
      if (imageUrlString.startsWith('{') && imageUrlString.endsWith('}')) {
        cleanUrlString = imageUrlString.substring(1, imageUrlString.length - 1)
      }

      // Split by comma
      const urls = cleanUrlString.split(',').map(url => url.trim())
      console.log(`Parsed ${urls.length} image URLs:`, urls)
      return urls
    } catch (error) {
      console.error('Error parsing image URLs:', error)
      return [imageUrlString] // Return original string as fallback
    }
  }

  // Helper method to fetch image as buffer from URL with better error handling
  private async getImageBufferFromUrl(url: string): Promise<Buffer> {
    // Image placeholder for failures - không sử dụng canvas
    const createErrorImageBuffer = () => {
      // Tạo một buffer cơ bản chứa hình ảnh placeholder đơn giản
      // Đây là một pixel 1x1 màu trắng trong định dạng PNG - nhẹ nhất có thể
      return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAIAAAD2HxkiAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ4IDc5LjE2NDAzNiwgMjAxOS8wOC8xMy0wMTowNjo1NyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjAgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkI5MDJDRDIzNTcwQjExRUJCMkE0OEIxQkY3QTcyNUVEIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkI5MDJDRDI0NTcwQjExRUJCMkE0OEIxQkY3QTcyNUVEIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QjkwMkNEMjE1NzBCMTFFQkIyQTQ4QjFCRjdBNzI1RUQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QjkwMkNEMjI1NzBCMTFFQkIyQTQ4QjFCRjdBNzI1RUQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwMDAwMDBAMDg8QDw4MExMUFBMTHBsbGxwfHx8fHx8fHx8fAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCABiAGIDAREAAhEBAxEB/8QAGgABAQEAAwEAAAAAAAAAAAAAAAEGAgMEBQEBAAAAAAAAAAAAAAAAAAAAABAAAQMCAwUECQIHAAAAAAAAAQACAwQFEQYhMRNRYRJBUhRxgZGhIjJCkkNyFTOzI1NisrMkNBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A+TsbYLVMYj4lSMGIw+V/itH3YeHLoQdVv1Q6nmjp6SgpGzVUohheJJnDmkcGgEsGrgCdiDXbO20Wu201upAeRSwtibyjAuw2knZie1BzoCAgICAgICAg4auKKWmqIZmlkckT2PbxDmkNcD2jDag/PoGqq7bd4jRTujqaZ76aaB/yuY+N5a4EfaCNuGKD9HQaAgICAgICAgIKfMX8QuvDi/qIIN/03XUdwtMM1PK17uQCSNpBfHIM2OaR2gjFBpSAgICAgICAgIKfMX8QuvDi/qIIN90zUxVFkpTFI17RG2N2BxDZGfK4HsI3IPdQEBAQEBAQEBAQU+Yv4hdeHF/UQQfpuiqGVtn4FQ0OikjhDQdha5gOB8OhBpCAgICAgICAgIKfMX8QuvDi/qIIN/0xx0xP7zfsoD9lBPUEBAQEBAQEBAQU+Yv4hdeHF/UQQdFBeKO3aXud5rj5ehoWGSaQAnlGwAADFzicGtG0lB8Z5nvlVK8UtvlpKc54Rx8NkoH1PccXnwwQb/pLUNNe7YySMtZVRYR1MD/mjkG7Eb2uG8H9hQelQEBAQEBAQEFPmL+IXXhxf1EEGu6VtP73cXSyNxoaInzDx/UkO2NvgBtPgN6D6sqaoqKqaeeV8s0ri+SWRxc97jvcSdpKDGqVs9ounC4QitdmD/MKEjBwA/NiB2HA7W9OGGKDYdD3l17sVPUyHGohPk6jEbXPaMHHHe4Yt9OxB71AQEBAQEBBV5fpI7vbr5ZZ25wVLOVwb1LXteDsO48pQb7p63xWu0UNuh+SnhZGDj1OIGLj4nE+lBYNG0Lp2O1U77nVsDrhVtHyEYiniOPK0cXH5j7N6CzutfdKO701uoKuCn86wvmfLA2TyUYcG4Y4j9QtIw6dhQdmn9SV9ZdqW2XOOETVGPl56ch0U5aCSMCcWuwGw+zrQaPQEBAQEBAQEBAQEBBn+obD5uX9yobhRXFvzjDGOQD6XNGOB6HYUHnrLrdbnZHW+3QshukkgijlqG8UUQLgZJXA7S0DBo60HCzUeqLT8kUJ+MJjjlABSSOa3rTuc4DA/V79iDTKCogrKeOpp5BJDKwPjeOhB6HgekIOdAQEBAQEBAQEGS3Wgu1qvdeK6EysgqqiWGohGMkOLyei0gdDhtQWGnLZLb4JJalsclbUvL5RGMWQtGxjAeg6nrj7EFmgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIP/Z', 'base64')
    }

    try {
      if (!url || url.trim() === '') {
        return createErrorImageBuffer()
      }

      let cleanUrl = url
      if (url.startsWith('{') && url.endsWith('}')) {
        cleanUrl = url.substring(1, url.length - 1)
      }

      // Xử lý URL S3 với cách tiếp cận mới
      if (cleanUrl.includes('.s3.amazonaws.com')) {
        try {
          // Không cần tạo presigned URL nếu URL đã có chữ ký
          if (!cleanUrl.includes('X-Amz-Signature')) {
            const urlObj = new URL(cleanUrl)
            const path = urlObj.pathname.substring(1)

            // Tạo presigned URL mới
            const presignedUrl = await this.getPreSignedUrl(path)
            if (presignedUrl) {
              cleanUrl = presignedUrl
            }
          }
        } catch (error) {
          // Tiếp tục với URL ban đầu nếu có lỗi
        }
      }

      // Thử tải ảnh với timeout ngắn
      const response = await axios.get(cleanUrl, {
        responseType: 'arraybuffer',
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
          keepAlive: true
        }),
        maxContentLength: 5 * 1024 * 1024, // 5MB limit
        timeout: 5000 // Giảm xuống 5 giây để không chờ lâu
      })

      if (response.status === 200 && response.data) {
        return Buffer.from(response.data)
      } else {
        return createErrorImageBuffer()
      }
    } catch (error) {
      // Log lỗi và trả về ảnh lỗi thay vì ném exception
      return createErrorImageBuffer()
    }
  }

  async createTaskAssignment(createTaskAssignmentDto: CreateTaskAssignmentDto) {
    try {
      const newAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: createTaskAssignmentDto.task_id,
          employee_id: createTaskAssignmentDto.employee_id,
          description: createTaskAssignmentDto.description,
          status: createTaskAssignmentDto.status,
        },
        include: {
          task: true, // Bao gồm thông tin của task
        },
      })

      // Gửi thông báo cho nhân viên được phân công
      try {
        // Lấy thông tin task 
        const taskName = newAssignment.task?.description || 'New Task';

        // Tạo notification cho user - sử dụng emit() thay vì send()
        this.notificationsClient.emit(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION, {
          userId: createTaskAssignmentDto.employee_id,
          title: 'Bạn đã được phân công một nhiệm vụ mới',
          content: `Bạn đã được phân công: ${taskName}`,
          type: NotificationType.TASK_ASSIGNMENT,
          relatedId: newAssignment.assignment_id,
          link: `/tasks/assignments/${newAssignment.assignment_id}`
        });

        this.logger.log(`Notification emitted for employee ${createTaskAssignmentDto.employee_id} for task ${createTaskAssignmentDto.task_id}`);
      } catch (notificationError) {
        // Log lỗi nhưng không làm ảnh hưởng đến việc tạo task
        this.logger.error(`Error emitting notification: ${notificationError.message}`, notificationError.stack);
      }

      return {
        statusCode: 201,
        message: 'Task assignment created successfully',
        data: newAssignment,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment creation failed',
      })
    }
  }

  async updateTaskAssignment(
    taskAssignmentId: string,
    updateTaskAssignmentDto: UpdateTaskAssignmentDto,
  ) {
    try {
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: taskAssignmentId },
        data: {
          task_id: updateTaskAssignmentDto.task_id,
          employee_id: updateTaskAssignmentDto.employee_id,
          description: updateTaskAssignmentDto.description,
          status: updateTaskAssignmentDto.status,
        },
      })
      return {
        statusCode: 200,
        message: 'Task assignment updated successfully',
        data: updatedAssignment,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment update failed',
      })
    }
  }

  async deleteTaskAssignment(taskAssignmentId: string) {
    try {
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: taskAssignmentId },
        data: { status: AssignmentStatus.Notcompleted }, // Change status to 'notcompleted'
      })
      return {
        statusCode: 200,
        message: 'Task assignment marked as not completed',
        data: updatedAssignment,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment update failed',
      })
    }
  }
  async getTaskAssignmentByUserId(userId: string) {
    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: { employee_id: userId },
        include: {
          task: true,
          // assignedTo: true
        },
      })
      return {
        statusCode: 200,
        message: 'Task assignments fetched successfully',
        data: assignments,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments for user',
      })
    }
  }

  async getTaskAssignmentById(taskAssignmentId: string) {
    try {
      console.log('Finding task assignment with ID:', taskAssignmentId)
      const assignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignmentId },
      })
      if (!assignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        })
      }
      return {
        statusCode: 200,
        message: 'Task assignment fetched successfully',
        data: assignment,
      }
    } catch (error) {
      console.error('Error in getTaskAssignmentById:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignment',
      })
    }
  }

  async getAllTaskAssignments(
    paginationParams: PaginationParams = { page: 1, limit: 10 },
  ): Promise<PaginationResponseDto<any>> {
    try {
      const page = Number(paginationParams.page) || 1
      const limit = Number(paginationParams.limit) || 10
      const skip = (page - 1) * limit
      const statusFilter = paginationParams.statusFilter

      // Build where clause for filtering
      const whereClause = statusFilter ? { status: statusFilter as AssignmentStatus } : {}

      // Get total count with filter
      const total = await this.prisma.taskAssignment.count({
        where: whereClause,
      })

      // Get paginated task assignments with filter
      const taskAssignments = await this.prisma.taskAssignment.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          task: true,
          // assignedTo: true
        },
        orderBy: {
          //assignedAt: 'desc'
        },
      })

      const responseData = {
        statusCode: 200,
        message: 'Task assignment list',
        data: taskAssignments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }

      return responseData
    } catch (error) {
      console.error('Error in getAllTaskAssignments:', error)
      const errorData = {
        statusCode: 500,
        message: error.message,
        data: [],
        pagination: {
          total: 0,
          page: Number(paginationParams.page) || 1,
          limit: Number(paginationParams.limit) || 10,
          totalPages: 0,
        },
      }

      return errorData
    }
  }

  async reassignTaskAssignment(
    taskAssignmentId: string,
    newEmployeeId: string,
  ) {
    try {
      // Tìm task assignment cũ
      const existingAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignmentId },
        include: {
          task: true
        }
      })
      if (existingAssignment.employee_id == newEmployeeId) {
        throw new RpcException({
          statusCode: 404,
          message: 'New employee is the same as the old employee please choose another employee',
        })
      }

      if (!existingAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        })
      }

      // Cập nhật trạng thái assignment cũ thành Reassigned
      const oldAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: taskAssignmentId },
        data: {
          status: AssignmentStatus.Reassigned,
          description: `${existingAssignment.description} Reassigned to new employee`
        },
        include: {
          task: true
        }
      })

      // Tạo assignment mới với dữ liệu từ assignment cũ nhưng employee mới
      const newAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: existingAssignment.task_id,
          employee_id: newEmployeeId,
          description: `Reassigned from assignment ${taskAssignmentId}\n Original description: ${existingAssignment.description}`,
          status: AssignmentStatus.InFixing,
        },
        include: {
          task: true
        }
      })

      return {
        statusCode: 200,
        message: 'Task reassigned successfully',
        data: {
          oldAssignment,
          newAssignment
        }
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Error reassigning task assignment: ' + error.message
      })
    }
  }

  async changeTaskAssignmentStatus(assignment_id: string, status: AssignmentStatus) {
    try {
      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id },
      })

      if (!existingAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        })
      }

      // Cập nhật trạng thái
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id },
        data: { status },
        include: {
          task: true,
        },
      })

      return {
        statusCode: 200,
        message: `Task assignment status changed to ${status} successfully`,
        data: updatedAssignment,
      }
    } catch (error) {
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: 500,
        message: `Failed to change task assignment status: ${error.message}`,
      })
    }
  }

  async getTaskAssignmentByStatus(status: AssignmentStatus) {
    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: { status },
      })
      return {
        statusCode: 200,
        message: 'Task assignments by status fetched successfully',
        data: assignments,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments by status',
      })
    }
  }

  async assignTaskToEmployee(taskId: string, employeeId: string, description: string) {
    try {
      // Check if the employee has any unconfirmed tasks
      const unconfirmedTasks = await this.prisma.taskAssignment.findMany({
        where: {
          employee_id: employeeId,
        }
      })

      // Check if the task exists
      const task = await this.prisma.task.findUnique({
        where: { task_id: taskId }
      })

      if (!task) {
        return {
          statusCode: 404,
          message: 'Task not found',
          data: null
        }
      }

      // Create new task assignment
      const newAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: taskId,
          employee_id: employeeId,
          description: description,
          status: AssignmentStatus.Pending
        },
        include: {
          task: true, // Bao gồm thông tin task để có thêm thông tin khi gửi thông báo
        },
      })

      // Gửi thông báo cho nhân viên được phân công
      try {
        // Lấy thông tin task để hiển thị trong thông báo
        const taskName = newAssignment.task?.description || 'New Task';

        // Đảm bảo dữ liệu notification đầy đủ và đúng định dạng
        const notificationData = {
          userId: employeeId,
          title: 'Bạn đã được phân công một nhiệm vụ mới',
          content: `Bạn đã được phân công: ${taskName}`,
          type: NotificationType.TASK_ASSIGNMENT, // Đảm bảo dùng đúng enum
          relatedId: newAssignment.assignment_id,
          link: `/tasks/assignments/${newAssignment.assignment_id}`
        };

        // Log chi tiết dữ liệu trước khi gửi
        this.logger.log(`Preparing to emit notification: ${JSON.stringify(notificationData)}`);

        // Sử dụng emit để tránh timeout
        this.notificationsClient.emit(NOTIFICATIONS_PATTERN.CREATE_NOTIFICATION, notificationData);

        this.logger.log(`Notification emitted to employee ${employeeId} for task ${taskId}`);
      } catch (notificationError) {
        // Log lỗi nhưng không làm ảnh hưởng đến việc phân công task
        this.logger.error(`Error emitting notification: ${notificationError.message}`, notificationError.stack);
      }

      return {
        statusCode: 201,
        message: 'Task assigned to employee successfully',
        data: newAssignment
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to assign task to employee',
        error: error.message
      })
    }
  }

  async getTaskAssignmentByTaskId(taskId: string) {
    try {
      const assignment = await this.prisma.task.findUnique({
        where: { task_id: taskId },
        include: {
          taskAssignments: true,
        },
      })
      if (!assignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        })
      }
      return {
        statusCode: 200,
        message: 'Task assignment fetched successfully',
        data: assignment,
      }
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignment',
      })
    }
  }

  async getDetails(taskAssignment_id: string) {
    try {
      this.logger.log(`Fetching task assignment details for ID: ${taskAssignment_id}`);

      // 1. Get inspection with task assignment
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignment_id },
        include: {
          task: true
        }
      })
      if (!taskAssignment) {
        this.logger.error(`Task assignment not found with ID: ${taskAssignment_id}`);
        return {
          success: false,
          message: 'taskAssignment not found',
          data: null
        }
      }

      // 2. Get task info
      const task = taskAssignment.task
      this.logger.log(`Found task with ID: ${task.task_id}`);

      // Create the result object
      const result: any = {
        assignment_id: taskAssignment.assignment_id,
        task_id: taskAssignment.task_id,
        description: taskAssignment.description,
        employee: null, // Placeholder for employee info
        status: taskAssignment.status,
        created_at: taskAssignment.created_at,
        updated_at: taskAssignment.updated_at,
        task: task
      }

      // 3. If crack_id exists, get crack info
      if (task?.crack_id) {
        this.logger.log(`Fetching crack info for ID: ${task.crack_id}`);

        const crackInfo = await firstValueFrom(
          this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
        )
        result.crackInfo = crackInfo

        // Get building info from crack data
        if (crackInfo?.data?.[0]?.buildingId) {
          const buildingId = crackInfo.data[0].buildingId;
          this.logger.log(`Using buildingId: ${buildingId} from crack data instead of buildingDetailId`);

          try {
            // Get building data using buildingId from crack report
            this.logger.log(`Sending request to building service with buildingId: ${buildingId}`);

            const buildingData = await firstValueFrom(
              this.buildingsClient.send(
                BUILDINGS_PATTERN.GET_BY_ID,
                { buildingId: buildingId }
              )
            )

            this.logger.log(`Building data response:`, JSON.stringify(buildingData, null, 2));

            // Add building data to result if found
            if (buildingData && buildingData.data) {
              this.logger.log(`Building data found, adding to result`);
              result.building = buildingData.data;
            } else {
              this.logger.warn(`Building data missing or invalid`, buildingData);

              // Create a mock building object with the data we have from crack report
              this.logger.log(`Creating building object from available crack data`);
              result.building = {
                building_id: crackInfo.data[0].buildingId,
                name: crackInfo.data[0].buildingName || 'Unknown Building',
                warranty_date: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), // Example warranty date 1 year from now
              };
              this.logger.log(`Created building data with warranty_date`);
            }
          } catch (buildingError) {
            this.logger.error(`Error fetching building data: ${buildingError.message}`, buildingError.stack);

            // Create a mock building object with the data we have from crack report
            this.logger.log(`Creating building object from available crack data due to error`);
            result.building = {
              building_id: crackInfo.data[0].buildingId,
              name: crackInfo.data[0].buildingName || 'Unknown Building',
              warranty_date: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), // Example warranty date 1 year from now
            };
            this.logger.log(`Created building data with warranty_date`);
          }
        } else if (crackInfo?.data?.[0]?.buildingName) {
          // If no buildingId but we have a buildingName, still create a mock building
          this.logger.warn(`No buildingId found but buildingName exists, creating mock building data`);
          result.building = {
            building_id: 'mock-id',
            name: crackInfo.data[0].buildingName,
            warranty_date: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), // Example warranty date 1 year from now
          };
        } else {
          this.logger.warn(`No building information found in crack data for crack_id: ${task.crack_id}`);
        }
      } else {
        this.logger.warn(`No crack_id found for task: ${task.task_id}`);
      }

      // 4. Get employee info from User service
      try {
        const employeeInfo = await firstValueFrom(
          this.userService.GetUserByIdForTaskAssignmentDetail({ userId: taskAssignment.employee_id })
        )

        if (employeeInfo && employeeInfo.isSuccess && employeeInfo.data) {
          result.employee = {
            employee_id: employeeInfo.data.userId,
            username: employeeInfo.data.username
          }
        }
      } catch (error) {
        this.logger.error(`Error getting employee details: ${error.message}`);
        result.employee = {
          employee_id: taskAssignment.employee_id,
          username: 'Unknown'
        }
      }

      // 5. If schedule_id exists, get schedule info (you can add this later)
      if (task?.schedule_job_id) {
        // Add schedule info retrieval here
      }

      return {
        success: true,
        message: 'Inspection details retrieved successfully',
        data: result
      }
    } catch (error) {
      this.logger.error(`Error retrieving inspection details: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Error retrieving inspection details',
        data: error.message
      }
    }
  }

  async updateStatusTaskAssignmentToReassigned(assignment_id: string, description: string) {
    try {
      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id },
      })

      if (!existingAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        })
      }

      // Kiểm tra xem status hiện tại có phải là InFixing hoặc Fixed không
      if (existingAssignment.status !== AssignmentStatus.InFixing &&
        existingAssignment.status !== AssignmentStatus.Fixed) {
        throw new RpcException({
          statusCode: 400,
          message: 'Task assignment status must be InFixing or Fixed to reassign',
        })
      }

      // Nối chuỗi description mới với description hiện tại
      const updatedDescription =
        `${existingAssignment.description}\n---\nReassigned reason: ${description}`

      // Cập nhật trạng thái thành Reassigned và cập nhật description
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id },
        data: {
          status: AssignmentStatus.Reassigned,
          description: updatedDescription
        },
        include: {
          task: true,
        },
      })

      return {
        statusCode: 200,
        message: 'Task assignment status changed to Reassigned successfully',
        data: updatedAssignment,
      }
    } catch (error) {
      // Nếu lỗi là RpcException, ném lại nguyên vẹn
      if (error instanceof RpcException) {
        throw error
      }

      // Xử lý các lỗi khác, trả về 400 thay vì 500
      throw new RpcException({
        statusCode: 400,
        message: `Failed to change task assignment status: ${error.message}`,
      })
    }
  }

  async getAllTaskAndTaskAssignmentByEmployeeId(employeeId: string) {
    try {
      // Find all task assignments for the employee
      const taskAssignments = await this.prisma.taskAssignment.findMany({
        where: { employee_id: employeeId },
        include: {
          task: true, // Include the related task for each assignment
        },
        orderBy: {
          created_at: 'desc', // Order by creation date, most recent first
        },
      })

      if (taskAssignments.length === 0) {
        return {
          statusCode: 200,
          message: 'No task assignments found for this employee',
          data: [],
        }
      }

      return {
        statusCode: 200,
        message: 'Tasks and assignments fetched successfully',
        data: taskAssignments,
      }
    } catch (error) {
      console.error('Error fetching tasks and assignments for employee:', error)
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to fetch tasks and assignments for employee',
        error: error.message,
      })
    }
  }

  /**
   * Export cost PDF report comparing estimated vs. actual costs
   * @param taskId The ID of the task
   * @returns PDF file as base64 string
   */
  async exportCostPdf(taskId: string) {
    try {
      console.log('Starting exportCostPdf for task ID:', taskId)

      // 1. Get the task with complete data
      const task = await this.prisma.task.findUnique({
        where: { task_id: taskId },
        include: {
          taskAssignments: {
            include: {
              inspections: {
                select: {
                  inspection_id: true,
                  inspected_by: true,
                  image_urls: true,
                  description: true,
                  created_at: true,
                  updated_at: true,
                  total_cost: true,
                  repairMaterials: {
                    include: {
                      material: {
                        select: {
                          material_id: true,
                          name: true,
                          unit_price: true,
                          description: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!task) {
        console.log('Task not found:', taskId)
        return {
          success: false,
          message: 'Task not found',
          data: null
        }
      }

      console.log('Task found:', task.task_id)

      // 2. Get crack information if available
      let crackInfo = null
      if (task.crack_id) {
        try {
          crackInfo = await firstValueFrom(
            this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
          )
          console.log('Crack info retrieved:', crackInfo?.isSuccess)
        } catch (err) {
          console.error('Failed to get crack details:', err.message)
        }
      }

      // 3. Calculate estimated cost - tổng total_cost những taskAssignment có status === Verified
      let estimatedCost = 0

      for (const assignment of task.taskAssignments) {
        if (assignment.status === AssignmentStatus.Verified) {
          for (const inspection of assignment.inspections) {
            estimatedCost += Number(inspection.total_cost) || 0
          }
        }
      }

      console.log('Calculated estimated cost (Verified):', estimatedCost)

      // 4. Calculate actual cost - tổng total_cost những taskAssignment có status === Confirmed
      let actualCost = 0
      let costDetails = []

      for (const assignment of task.taskAssignments) {
        if (assignment.status === AssignmentStatus.Confirmed) {
          for (const inspection of assignment.inspections) {
            actualCost += Number(inspection.total_cost) || 0

            // Get material details for the report
            if (inspection.repairMaterials && inspection.repairMaterials.length > 0) {
              inspection.repairMaterials.forEach(material => {
                // Lấy tên vật liệu từ bảng material nếu có
                const materialName = material.material?.name || 'Unknown Material'

                costDetails.push({
                  name: `Material Name: ${materialName}`,
                  quantity: material.quantity,
                  unitCost: Number(material.unit_cost),
                  totalCost: Number(material.total_cost)
                })
              })
            }
          }
        }
      }

      console.log('Calculated actual cost (Confirmed):', actualCost)
      console.log('Cost details count:', costDetails.length)

      // Log the first inspection with materials for debugging
      for (const assignment of task.taskAssignments) {
        for (const inspection of assignment.inspections) {
          if (inspection.repairMaterials && inspection.repairMaterials.length > 0) {
            console.log('First inspection with materials:', inspection.inspection_id)
            console.log('Complete materials list:', JSON.stringify(inspection.repairMaterials, null, 2))
            break
          }
        }
      }

      // 5. Generate PDF
      try {
        console.log('Generating PDF...')
        const pdfBuffer = await this.generateCostPdf(task, estimatedCost, actualCost, true, costDetails, crackInfo)
        console.log('PDF generated successfully, buffer size:', pdfBuffer.length)

        // 6. Return base64 encoded PDF
        return {
          success: true,
          message: 'Cost PDF report generated successfully',
          data: pdfBuffer.toString('base64')
        }
      } catch (pdfError) {
        console.error('Error in PDF generation:', pdfError)
        return {
          success: false,
          message: 'Error generating PDF',
          error: pdfError.message
        }
      }
    } catch (error) {
      console.error('Error in exportCostPdf:', error)
      return {
        success: false,
        message: 'Error generating cost PDF report',
        error: error.message
      }
    }
  }

  /**
   * Generate PDF document with cost information
   */
  private async generateCostPdf(
    task,
    estimatedCost: number,
    actualCost: number,
    isCompleted: boolean,
    costDetails: any[] = [],
    crackInfo: any = null
  ) {
    return new Promise<Buffer>(async (resolve, reject) => {
      try {
        console.log('Initializing PDFDocument...')
        const path = require('path')

        // Define consistent margins
        const PAGE_MARGIN = 40
        const CONTENT_WIDTH = 515 // A4 width (595) - margins on both sides

        const doc = new PDFDocument({
          autoFirstPage: true,
          size: 'A4',
          margin: PAGE_MARGIN,
          info: {
            Title: 'Báo cáo kiểm tra',
            Author: 'BMCMS',
            Subject: 'Báo cáo kiểm tra vết nứt',
            Keywords: 'kiểm tra, báo cáo, vết nứt',
            CreationDate: new Date()
          }
        })

        // Try multiple font paths and fallback options
        const fontPaths = [
          path.join(process.cwd(), 'libs', 'contracts', 'src', 'taskAssigment', 'fonts', 'ARIAL.TTF'),
          path.join(process.cwd(), 'dist', 'libs', 'contracts', 'src', 'taskAssigment', 'fonts', 'ARIAL.TTF'),
          '/usr/src/app/libs/contracts/src/taskAssigment/fonts/ARIAL.TTF',
          '/usr/src/app/dist/libs/contracts/src/taskAssigment/fonts/ARIAL.TTF'
        ]

        let fontLoaded = false
        for (const fontPath of fontPaths) {
          try {
            console.log('Trying to load font from:', fontPath)
            doc.registerFont('VietnameseFont', fontPath)
            doc.font('VietnameseFont')
            fontLoaded = true
            console.log('Successfully loaded font from:', fontPath)
            break
          } catch (error) {
            console.error('Failed to load font from:', fontPath, error)
          }
        }

        if (!fontLoaded) {
          console.warn('No Vietnamese font loaded, falling back to Helvetica')
          doc.font('Helvetica')
        }

        const chunks = []
        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => {
          console.log('PDF document ended, resolving promise...')
          const buffer = Buffer.concat(chunks)
          resolve(buffer)
        })
        doc.on('error', (err) => {
          console.error('PDF document error:', err)
          reject(err)
        })

        // Track vertical position throughout document
        let yPos = PAGE_MARGIN // Initialize at top margin
        const LINE_HEIGHT = 18 // Standard line height
        const SECTION_SPACING = 20 // Space between sections

        // Header with blue background
        doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 60)
          .fillAndStroke('#3478F6', '#3478F6')
        yPos += 20
        doc.fillColor('white')
          .fontSize(16)
          .font('VietnameseFont')
          .text('BÁO CÁO KIỂM TRA', PAGE_MARGIN + 10, yPos, { align: 'left' })

        yPos += 20
        doc.fontSize(10)
          .text('Được tạo: ' + new Date().toLocaleString(), PAGE_MARGIN + 10, yPos, { align: 'left' })

        // Reset text color
        doc.fillColor('black')
        yPos += 30 // Move below header

        // Logo (placed on the right side of header)
        try {
          const path = require('path');

          // Use the correct path to logo.jpg
          const logoPath = path.join(process.cwd(), 'libs', 'contracts', 'src', 'logo', 'logo.jpg');
          console.log('Loading logo from:', logoPath);

          // Vẽ logo với kích thước phù hợp
          doc.image(logoPath, CONTENT_WIDTH - 70, PAGE_MARGIN + 5, {
            fit: [80, 50],
            align: 'center',
            valign: 'center'
          });
        } catch (error) {
          console.error('Error loading logo:', error);
          // Fallback nếu có lỗi khi đọc file
          doc.rect(CONTENT_WIDTH - 70, PAGE_MARGIN + 5, 80, 50).stroke();
          doc.fontSize(10).text('BMCMS', CONTENT_WIDTH - 50, PAGE_MARGIN + 25, { align: 'center' });
        }

        // Section: Crack report information
        yPos += 10
        doc.fontSize(14)
          .fillColor('#000000')
          .text('Thông tin báo cáo vết nứt', PAGE_MARGIN, yPos, { underline: true })
        yPos += LINE_HEIGHT + 5

        // Two-column layout for crack info
        const colWidth = CONTENT_WIDTH / 2 - 5

        // Lấy thông tin reportby từ crack record
        const reportby = crackInfo?.data && crackInfo.data[0]?.reportedBy?.username || 'N/A'
        const reportDate = crackInfo?.data && crackInfo.data[0]?.createdAt
          ? new Date(crackInfo.data[0].createdAt).toLocaleString()
          : 'N/A'

        // Get severity from first crack detail if available
        const severity = crackInfo?.data && crackInfo.data[0]?.crackDetails && crackInfo.data[0].crackDetails.length > 0
          ? crackInfo.data[0].crackDetails[0].severity
          : 'N/A'

        // Left column
        doc.text('Người báo cáo:', PAGE_MARGIN, yPos)
        doc.text(reportby, PAGE_MARGIN + 110, yPos)
        yPos += LINE_HEIGHT

        doc.text('Ngày báo cáo:', PAGE_MARGIN, yPos)
        doc.text(reportDate, PAGE_MARGIN + 90, yPos)
        yPos += LINE_HEIGHT

        // Right column
        doc.text('Mức độ nghiêm trọng:', PAGE_MARGIN + colWidth, yPos - LINE_HEIGHT * 2)
        doc.text(severity, PAGE_MARGIN + colWidth + 140, yPos - LINE_HEIGHT * 2)

        doc.text('Xác nhận thanh toán:', PAGE_MARGIN + colWidth, yPos - LINE_HEIGHT)
        doc.text('Xác nhận', PAGE_MARGIN + colWidth + 140, yPos - LINE_HEIGHT)

        // Description (full width)
        yPos += LINE_HEIGHT
        doc.text('Mô tả:', PAGE_MARGIN, yPos)
        yPos += LINE_HEIGHT

        // Description text in a box
        const descriptionText = task.description || 'Không có'
        doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 30).fillAndStroke('#FFFFFF', '#000000')
        doc.fillColor('#000000')
          .fontSize(9)
          .text(descriptionText, PAGE_MARGIN + 5, yPos + 5, {
            width: CONTENT_WIDTH - 10,
            height: 20,
            ellipsis: true
          })
        yPos += 40

        // Section: Crack Detail Images
        yPos += SECTION_SPACING
        doc.fontSize(14)
          .fillColor('#000000')
          .text('Hình ảnh chi tiết vết nứt', PAGE_MARGIN, yPos, { underline: true })
        yPos += LINE_HEIGHT + 5

        // Draw frames for crack detail images
        const crackImageWidth = CONTENT_WIDTH / 2 - 10
        const crackImageHeight = 100

        // Box 1 - Original Photo
        doc.rect(PAGE_MARGIN, yPos, crackImageWidth, crackImageHeight).fillAndStroke('#FFFFFF', '#000000')
        doc.fontSize(10).fillColor('#000000').text('Ảnh gốc', PAGE_MARGIN + 5, yPos + 5)

        // Box 2 - AI Detection
        doc.rect(PAGE_MARGIN + crackImageWidth + 20, yPos, crackImageWidth, crackImageHeight).fillAndStroke('#FFFFFF', '#000000')
        doc.fontSize(10).fillColor('#000000').text('Ảnh phát hiện bởi AI', PAGE_MARGIN + crackImageWidth + 25, yPos + 5)

        // Add images from crack detail if available
        if (crackInfo?.data && crackInfo.data[0]?.crackDetails && crackInfo.data[0].crackDetails.length > 0) {
          try {
            const crackDetail = crackInfo.data[0].crackDetails[0]

            // Add original photo in first rectangle if available
            if (crackDetail.photoUrl) {
              try {
                // Tải ảnh với xử lý lỗi tốt hơn - sẽ không throw lỗi nữa
                const imageBuffer = await this.getImageBufferFromUrl(crackDetail.photoUrl)
                doc.image(imageBuffer, PAGE_MARGIN + 5, yPos + 20, {
                  fit: [crackImageWidth - 10, crackImageHeight - 25],
                  align: 'center',
                  valign: 'center'
                })
              } catch (imgError) {
                // Fallback text sẽ không còn cần thiết vì getImageBufferFromUrl luôn trả về buffer
              }
            } else {
              // Vẽ một placeholder đơn giản
              doc.rect(PAGE_MARGIN + 30, yPos + 30, crackImageWidth - 70, crackImageHeight - 60)
                .fillAndStroke('#f8f8f8', '#cccccc')
              doc.fillColor('#999999').fontSize(10)
              doc.text('Không có ảnh gốc', PAGE_MARGIN + crackImageWidth / 2 - 40, yPos + 50)
            }

            // Add AI detection photo in second rectangle if available
            if (crackDetail.aiDetectionUrl) {
              try {
                const aiImageBuffer = await this.getImageBufferFromUrl(crackDetail.aiDetectionUrl)
                doc.image(aiImageBuffer, PAGE_MARGIN + crackImageWidth + 25, yPos + 20, {
                  fit: [crackImageWidth - 10, crackImageHeight - 25],
                  align: 'center',
                  valign: 'center'
                })
              } catch (imgError) {
                // Fallback text sẽ không còn cần thiết
              }
            } else {
              // Vẽ một placeholder đơn giản
              doc.rect(PAGE_MARGIN + crackImageWidth + 55, yPos + 30, crackImageWidth - 70, crackImageHeight - 60)
                .fillAndStroke('#f8f8f8', '#cccccc')
              doc.fillColor('#999999').fontSize(10)
              doc.text('Không có ảnh phát hiện bởi AI', PAGE_MARGIN + crackImageWidth + crackImageWidth / 2 - 40, yPos + 50)
            }
          } catch (imgError) {
            // Vẽ placeholders cho cả hai ảnh
            doc.fillColor('#999999').fontSize(10)
            doc.text('Không có chi tiết vết nứt', PAGE_MARGIN + 30, yPos + 50)
            doc.text('Không có chi tiết vết nứt', PAGE_MARGIN + crackImageWidth + 50, yPos + 50)
          }
        } else {
          // Vẽ placeholders cho cả hai ảnh
          doc.fillColor('#999999').fontSize(10)
          doc.text('Không có chi tiết vết nứt', PAGE_MARGIN + 30, yPos + 50)
          doc.text('Không có chi tiết vết nứt', PAGE_MARGIN + crackImageWidth + 50, yPos + 50)
        }

        // Show creation date from the crack detail
        yPos += crackImageHeight + 10
        if (crackInfo?.data && crackInfo.data[0]?.crackDetails && crackInfo.data[0].crackDetails.length > 0) {
          const crackDetail = crackInfo.data[0].crackDetails[0]
          const creationDate = crackDetail.createdAt
            ? new Date(crackDetail.createdAt).toLocaleString()
            : 'Date not available'
          doc.fontSize(10).text(`Ngày phát hiện: ${creationDate}`, PAGE_MARGIN, yPos)
        } else {
          doc.fontSize(10).text('Ngày phát hiện: Không có', PAGE_MARGIN, yPos)
        }

        // Section: Inspection Images - reduce spacing from previous section
        yPos += 40 // Reduced from SECTION_SPACING (20)
        doc.fontSize(14)
          .fillColor('#000000')
          .text('Hình ảnh kiểm tra', PAGE_MARGIN, yPos, { underline: true })
        yPos += LINE_HEIGHT + 10 // Reduced by 5

        // Status order priority (for sorting)
        const statusOrder = {
          'Verified': 1,
          'Unverified': 2,
          'InFixing': 3,
          'Fixed': 4,
          'Confirmed': 5,
          'Reassigned': 6,
          'Pending': 7
        }

        // Display images from inspections if available
        let imageContentAdded = false // Track if we've added any real image content
        if (task.taskAssignments && task.taskAssignments.length > 0) {
          let hasImages = false

          // Collect all inspections from all assignments
          let allInspections = []

          // Group and flatten all inspections with their task assignment status
          for (const assignment of task.taskAssignments) {
            if (assignment.inspections && assignment.inspections.length > 0) {
              for (const inspection of assignment.inspections) {
                if (inspection.image_urls && (Array.isArray(inspection.image_urls) && inspection.image_urls.length > 0 ||
                  typeof inspection.image_urls === 'string' && inspection.image_urls.trim() !== '')) {
                  // Add each inspection with its related assignment status
                  allInspections.push({
                    inspection: inspection,
                    status: assignment.status,
                    assignmentId: assignment.assignment_id
                  })
                  hasImages = true
                }
              }
            }
          }

          // Sort inspections by task assignment status priority
          allInspections.sort((a, b) => {
            const statusA = statusOrder[a.status] || 999
            const statusB = statusOrder[b.status] || 999
            return statusA - statusB
          })

          if (hasImages) {
            // Tạo mảng chứa tất cả promise để tải ảnh trước
            const imagePromises = new Map()

            // Thu thập tất cả URL ảnh và tạo promise tải ảnh
            for (let i = 0; i < allInspections.length; i++) {
              const { inspection } = allInspections[i]

              let imageUrls = []
              if (typeof inspection.image_urls === 'string') {
                imageUrls = this.parseImageUrls(inspection.image_urls)
              } else if (Array.isArray(inspection.image_urls)) {
                imageUrls = inspection.image_urls
              }

              // Tạo promise cho mỗi ảnh và lưu vào map
              for (const imgUrl of imageUrls) {
                if (imgUrl && imgUrl.trim() !== '' && !imagePromises.has(imgUrl)) {
                  // Tạo promise cho mỗi URL - getImageBufferFromUrl sẽ không throw lỗi nữa
                  imagePromises.set(imgUrl, this.getImageBufferFromUrl(imgUrl))
                }
              }
            }

            // Tải song song tất cả ảnh trước với xử lý lỗi tốt hơn
            try {
              await Promise.all(imagePromises.values())
            } catch (error) {
              // Bỏ qua lỗi - các ảnh lỗi sẽ được thay thế bằng placeholder
            }

            // Now display each inspection in a full-width row
            for (let i = 0; i < allInspections.length; i++) {
              const { inspection, status, assignmentId } = allInspections[i]

              // Process the image URLs - can be an array or a string
              let imageUrls = []
              if (typeof inspection.image_urls === 'string') {
                imageUrls = this.parseImageUrls(inspection.image_urls)
              } else if (Array.isArray(inspection.image_urls)) {
                imageUrls = inspection.image_urls
              }

              if (imageUrls.length > 0) {
                // Get materials information if available
                let materialsText = 'No materials information'
                let totalCost = 'N/A'
                let materialCount = 0

                if (inspection.repairMaterials && inspection.repairMaterials.length > 0) {
                  // Optimize material processing
                  const materialMap = new Map()
                  const materialIds = new Set()

                  // Faster processing of materials 
                  for (const material of inspection.repairMaterials) {
                    const materialId = material.material?.material_id || material.material_id || 'unknown'
                    if (!materialIds.has(materialId)) {
                      materialIds.add(materialId)
                      materialMap.set(materialId, {
                        id: materialId,
                        name: material.material?.name || 'Unknown Material',
                        quantity: Number(material.quantity) || 0,
                        unitCost: Number(material.unit_cost) || 0,
                        totalCost: (Number(material.quantity) || 0) * (Number(material.unit_cost) || 0)
                      })
                    } else {
                      // Đã có, cộng thêm số lượng
                      const existing = materialMap.get(materialId)
                      const quantity = Number(material.quantity) || 0
                      existing.quantity += quantity
                      existing.totalCost += quantity * (Number(material.unit_cost) || 0)
                    }
                  }

                  // Convert map to array and create text
                  const uniqueMaterials = Array.from(materialMap.values())
                  materialCount = uniqueMaterials.length

                  // Format the materials text - use join for better performance
                  materialsText = uniqueMaterials.map(material =>
                    `• ${material.name} (${material.quantity} × ${material.unitCost.toLocaleString('vi-VN')} VND)`
                  ).join('\n')

                  // Format the total cost
                  totalCost = inspection.total_cost && !isNaN(inspection.total_cost)
                    ? `${Number(inspection.total_cost).toLocaleString('vi-VN')} VND`
                    : 'N/A'
                }

                // Calculate how many rows of images we'll need (2 images per row)
                const imagesPerRow = 2
                const imageRows = Math.ceil(imageUrls.length / imagesPerRow)

                // Each row of images needs this much height
                const rowHeight = 140

                // Calculate the initial container height based on content
                let containerBaseHeight = 100 // Base height for header and description

                // Tính toán chính xác vị trí của ảnh dựa trên số lượng material
                // Nếu không có material thì khoảng cách sẽ bé hơn
                const materialSpace = materialCount > 0 ? 15 + materialCount * 20 : 10

                // Calculate the exact height needed for images
                const imagesHeight = imageRows * rowHeight

                // Calculate how many images per row (always 2 images per row)
                let imagesInLastRow = imageUrls.length % imagesPerRow
                if (imagesInLastRow === 0 && imageUrls.length > 0) {
                  imagesInLastRow = imagesPerRow // If last row is full
                }

                // Final container height: base + materials + images + small buffer
                const estimatedHeight = 20 + materialSpace + imagesHeight + 30
                const containerHeight = estimatedHeight

                console.log(`Container sizing: base=100, materials=${materialSpace}, images=${imagesHeight}, total=${containerHeight}`)

                // Check if this inspection will fit on current page, if not add a new page
                if (yPos + containerHeight > 900) {
                  doc.addPage()
                  yPos = PAGE_MARGIN + 10 // Start higher on new page
                }

                // Create a full-width container for this inspection - exact size for content
                imageContentAdded = true

                // Create a status badge with colored background
                let statusColor
                switch (status) {
                  case 'Verified': statusColor = '#4CAF50'; break // Green
                  case 'Unverified': statusColor = '#FF9800'; break // Orange
                  case 'InFixing': statusColor = '#2196F3'; break // Blue
                  case 'Fixed': statusColor = '#9C27B0'; break // Purple
                  case 'Confirmed': statusColor = '#00BCD4'; break // Teal
                  case 'Reassigned': statusColor = '#F44336'; break // Red
                  default: statusColor = '#9E9E9E' // Grey
                }

                // Draw container outline with status color - precise size
                doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, containerHeight).fillAndStroke('#FFFFFF', statusColor)

                // Header with status and inspection ID - IMPROVED HEADER STYLING
                doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 20).fillAndStroke(statusColor, statusColor)
                doc.fillColor('white').fontSize(11).font('VietnameseFont', 'bold')

                // Format the inspection date
                const inspectionDate = inspection.created_at
                  ? new Date(inspection.created_at).toLocaleDateString()
                  : 'Unknown date'

                // Draw status badge - IMPROVED BADGE STYLING
                const statusWidth = 100 // Increased width for better visibility
                doc.rect(PAGE_MARGIN + CONTENT_WIDTH - statusWidth - 10, yPos + 2, statusWidth, 16)
                  .fillAndStroke(statusColor, '#000000') // Added black border for contrast
                doc.fillColor('white').text(status,
                  PAGE_MARGIN + CONTENT_WIDTH - statusWidth - 10 + 5,
                  yPos + 4,
                  { width: statusWidth - 10, align: 'center' }
                )

                // Reset text color and write header
                doc.fillColor('white').text( // Changed to white for better contrast on colored header
                  `Kiểm tra (${inspectionDate}) - ID: ${inspection.inspection_id.substring(0, 8)}...`,
                  PAGE_MARGIN + 10,
                  yPos + 5
                )

                // Add inspection description and details at the top - more compact layout
                const detailsX = PAGE_MARGIN + 10
                const detailsWidth = CONTENT_WIDTH - 20

                // Description title
                doc.fontSize(10).font('VietnameseFont', 'bold') // Reduced font size
                  .fillColor('#000000')
                  .text('Mô tả:', detailsX, yPos + 25) // Reduced vertical space

                // Description content
                doc.fontSize(9).font('VietnameseFont', 'normal')
                  .fillColor('#333333')
                  .text(inspection.description || 'No description available',
                    detailsX,
                    yPos + 35, // Reduced vertical space
                    { width: detailsWidth, height: 30, ellipsis: true }
                  )

                // Materials section - reduced vertical space
                doc.fontSize(10).font('VietnameseFont', 'bold') // Reduced font size
                  .fillColor('#000000')
                  .text('Vật liệu:', detailsX, yPos + 60) // Reduced vertical space

                // Add a background to make ALL materials visible with stronger contrast
                const materialsBoxHeight = materialCount * 30 + 20 // Additional padding
                if (materialCount > 0) {
                }

                // Set text color explicitly to BLACK before drawing text
                doc.fontSize(10).font('VietnameseFont', 'normal')
                  .fillColor('#000000')

                // Add the text with plenty of height - FORCE black color again for safety
                doc.fillColor('#000000') // Force black color again
                  .text(materialsText,
                    detailsX + 10, // More padding
                    yPos + 75, // Slight adjustment to vertical position
                    {
                      width: detailsWidth - 130, // Narrower to fit within box
                      height: materialsBoxHeight - 10, // More padding
                      ellipsis: false, // Never truncate with ellipsis
                      lineBreak: true // Ensure line breaks work properly
                    }
                  )

                // Chi phí - cải thiện căn chỉnh
                const costLabelX = PAGE_MARGIN + CONTENT_WIDTH - 170;
                const costValueX = PAGE_MARGIN + CONTENT_WIDTH - 100;

                // Estimated cost - hiển thị label với vị trí cố định
                doc.fontSize(10).font('VietnameseFont', 'bold')
                  .fillColor('#000000')
                  .text('Chi phí:', costLabelX, yPos + 70, { align: 'right', width: 60 })

                // Hiển thị giá trị tiền với vị trí cố định và căn phải
                doc.fontSize(10).fillColor('#d32f2f').font('VietnameseFont', 'bold')
                  .text(totalCost, costValueX, yPos + 70, { align: 'right', width: 90 })

                // Position images precisely based on material content
                // Giảm khoảng cách giữa phần materials và ảnh, phụ thuộc vào số lượng material
                const imageBaseY = yPos + 50 + materialSpace // Vị trí bắt đầu của ảnh sau phần materials
                const imageWidth = (CONTENT_WIDTH - 50) / imagesPerRow // Width of each image
                const imageHeight = 120 // Height of each image
                const imageHorizontalSpacing = 10 // Space between images horizontally

                // Display multiple images in a grid - with precise layout
                for (let imgIndex = 0; imgIndex < imageUrls.length; imgIndex++) {
                  const row = Math.floor(imgIndex / imagesPerRow)
                  const col = imgIndex % imagesPerRow

                  const imgX = PAGE_MARGIN + 20 + col * (imageWidth + imageHorizontalSpacing)
                  const imgY = imageBaseY + row * (imageHeight + 10)

                  try {
                    doc.fillColor('#333333').fontSize(9).font('VietnameseFont', 'bold')
                    doc.rect(imgX, imgY, imageWidth, imageHeight).fillAndStroke('#FFFFFF', statusColor)

                    const imgUrl = imageUrls[imgIndex]
                    if (!imgUrl || imgUrl.trim() === '') {
                      doc.fillColor('#333333').fontSize(9)
                      doc.text('Invalid image URL', imgX + 20, imgY + 50)
                      continue
                    }

                    // Sử dụng ảnh đã được tải trước đó - luôn có giá trị do getImageBufferFromUrl không throw lỗi
                    const imgBuffer = await imagePromises.get(imgUrl)
                    doc.image(imgBuffer, imgX + 5, imgY + 5, {
                      fit: [imageWidth - 10, imageHeight - 10],
                      align: 'center',
                      valign: 'center'
                    })
                  } catch (imgError) {
                    doc.fillColor('#333333').fontSize(9)
                    doc.text('Error loading image', imgX + 20, imgY + 50)
                  }
                }

                // Move position for next inspection - smaller gap between inspections
                yPos += containerHeight + 10 // Reduced from 15
              } else {
                // No images found - smaller message box
                imageContentAdded = true
                doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 70).fillAndStroke('#FFFFFF', '#cccccc')
                doc.fontSize(12).text('No inspection images available', PAGE_MARGIN + CONTENT_WIDTH / 2 - 80, yPos + 30)
                yPos += 80 // Reduced from 110
              }
            }
          } else {
            // No task assignments found - smaller message box
            imageContentAdded = true
            doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 70).fillAndStroke('#FFFFFF', '#cccccc')
            doc.fontSize(12).text('No task assignments available', PAGE_MARGIN + CONTENT_WIDTH / 2 - 80, yPos + 30)
            yPos += 80 // Reduced from 110
          }
        } else {
          // No task assignments found - smaller message box
          imageContentAdded = true
          doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 70).fillAndStroke('#FFFFFF', '#cccccc')
          doc.fontSize(12).text('No task assignments available', PAGE_MARGIN + CONTENT_WIDTH / 2 - 80, yPos + 30)
          yPos += 80 // Reduced from 110
        }

        // Check if we have any content yet - if not, add a default "No Data" message
        if (!imageContentAdded) {
          // There's a large empty space, which means no real content was added
          doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 80).fillAndStroke('#f9f9f9', '#cccccc')

          // Add a warning symbol
          doc.fontSize(20).fillColor('#FF9800')
          doc.text('⚠', PAGE_MARGIN + CONTENT_WIDTH / 2 - 10, yPos + 15, { align: 'center' })

          // Add explanatory text
          doc.fontSize(12).fillColor('#333333')
          doc.text('No inspection images available for this report',
            PAGE_MARGIN + 20,
            yPos + 40,
            { align: 'center', width: CONTENT_WIDTH - 40 })

          yPos += 90 // Smaller message box
        }

        // Now output the final Cost Summary section on a new page if needed
        const costSummaryHeight = LINE_HEIGHT * 6 // Approximate height for cost summary section

        // Check if there's enough space for the Cost Summary
        if (yPos + costSummaryHeight > 700) {
          // Not enough space, add a new page
          doc.addPage()
          yPos = PAGE_MARGIN + 10 // Reduced top margin
        }

        // Add a divider line
        doc.moveTo(PAGE_MARGIN, yPos).lineTo(PAGE_MARGIN + CONTENT_WIDTH, yPos).stroke('#cccccc')
        yPos += 15

        // Cost summary section with background
        doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, costSummaryHeight).fillAndStroke('#f8f8f8', '#cccccc')

        yPos += 10
        doc.fontSize(14)
          .fillColor('#000000')
          .text('Tổng kết chi phí:', PAGE_MARGIN + 10, yPos, { underline: true })
        doc.fillColor('black')
        yPos += LINE_HEIGHT + 5

        // Cải thiện căn chỉnh phần tổng kết chi phí
        const summaryLabelWidth = 150;
        const summaryValueWidth = 120;
        const summaryLabelX = PAGE_MARGIN + 20;
        const summaryValueX = PAGE_MARGIN + 200;

        // Display cost information with more emphasis and better alignment
        doc.fontSize(12)
          .fillColor('#333333')
          .text(`Tổng chi phí dự kiến:`, summaryLabelX, yPos, { align: 'left', width: summaryLabelWidth })
        doc.fontSize(12)
          .fillColor('#d32f2f')
          .text(`${estimatedCost.toLocaleString('vi-VN')} VND`, summaryValueX, yPos, { align: 'right', width: summaryValueWidth })
        yPos += LINE_HEIGHT + 5

        doc.fontSize(12)
          .fillColor('#333333')
          .text(`Tổng chi phí thực tế:`, summaryLabelX, yPos, { align: 'left', width: summaryLabelWidth })
        doc.fontSize(12)
          .fillColor('#d32f2f')
          .text(`${actualCost.toLocaleString('vi-VN')} VND`, summaryValueX, yPos, { align: 'right', width: summaryValueWidth })
        yPos += LINE_HEIGHT + 15

        // Calculate signature section positioning
        const footerHeight = 120 // Height needed for the footer content (reduced from 150)
        const pageBottom = 770 // Bottom position of the page
        const remainingSpace = pageBottom - yPos
        const idealFooterGap = 50 // Ideal gap between cost summary and signatures

        // Calculate the optimal Y position for the footer
        let footerY

        if (remainingSpace < footerHeight + idealFooterGap) {
          // Not enough room for footer with ideal gap, add a new page
          doc.addPage()
          footerY = PAGE_MARGIN + 100 // Position footer at nice height on new page
        } else if (remainingSpace > footerHeight + 150) {
          // Too much empty space, position footer at a reasonable distance
          footerY = yPos + idealFooterGap
        } else {
          // Just enough space, center the footer in the remaining space
          footerY = yPos + (remainingSpace - footerHeight) / 2
        }

        // Add date line
        doc.fontSize(10)
          .fillColor('#000000')
          .text(`Hồ Chí Minh, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
            PAGE_MARGIN,
            footerY, // Use calculated footer position
            { align: 'right', width: CONTENT_WIDTH })

        // Signatures section with clear spacing
        const sigWidth = 100
        const sigMargin = (CONTENT_WIDTH - (sigWidth * 3)) / 4
        const sigY = footerY + 20

        // Add a background for signature section
        doc.rect(PAGE_MARGIN, sigY, CONTENT_WIDTH, 100).fillAndStroke('#f5f5f5', '#cccccc')

        // Manager signature
        doc.fillColor('#000000').fontSize(10).font('VietnameseFont', 'bold')
        doc.text('Chữ ký quản lý', PAGE_MARGIN + sigMargin, sigY + 10, { align: 'center', width: sigWidth })
        doc.rect(PAGE_MARGIN + sigMargin, sigY + 30, sigWidth, 50).fillAndStroke('#FFFFFF', '#000000')

        // Leader signature
        doc.fillColor('#000000').fontSize(10).font('VietnameseFont', 'bold')
        doc.text('Chữ ký trưởng nhóm', PAGE_MARGIN + sigMargin * 2 + sigWidth, sigY + 10, { align: 'center', width: sigWidth })
        doc.rect(PAGE_MARGIN + sigMargin * 2 + sigWidth, sigY + 30, sigWidth, 50).fillAndStroke('#FFFFFF', '#000000')

        // Resident signature
        doc.fillColor('#000000').fontSize(10).font('VietnameseFont', 'bold')
        doc.text('Chữ ký cư dân', PAGE_MARGIN + sigMargin * 3 + sigWidth * 2, sigY + 10, { align: 'center', width: sigWidth })
        doc.rect(PAGE_MARGIN + sigMargin * 3 + sigWidth * 2, sigY + 30, sigWidth, 50).fillAndStroke('#FFFFFF', '#000000')


        // Reset fill color for remaining content
        doc.fillColor('black')

        console.log('Finalizing PDF...')
        doc.end()

      } catch (err) {
        console.error('Fatal error in PDF generation:', err)
        reject(err)
      }
    })
  }

  async updateTaskAssignmentStatusToCreateWorklog(payload: {
    assignment_id: string
    status: AssignmentStatus
  }) {
    try {
      // 1. Get the task assignment to verify it exists and to get the task_id
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: payload.assignment_id },
        include: { task: true }
      })

      if (!taskAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found'
        })
      }

      // 2. Update the task assignment status
      const updatedTaskAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: payload.assignment_id },
        data: { status: payload.status }
      })

      // 3. Generate appropriate worklog title and description based on status
      let worklog_title = ''
      let worklog_description = ''

      // Determine the appropriate worklog status and title/description based on the task assignment status
      let worklogStatus
      switch (payload.status) {
        case 'Pending':
          worklogStatus = 'INIT_INSPECTION'
          worklog_title = 'Nhiệm vụ mới được tạo'
          worklog_description = 'Nhiệm vụ đã được phân công và đang chờ kiểm tra.'
          break
        case 'Verified':
          worklogStatus = 'WAIT_FOR_DEPOSIT'
          worklog_title = 'Nhiệm vụ đã được xác minh'
          worklog_description = 'Nhiệm vụ đã được xác minh và đang chờ đặt cọc.'
          break
        case 'InFixing':
          worklogStatus = 'EXECUTE_CRACKS'
          worklog_title = 'Nhiệm vụ đang được sửa chữa'
          worklog_description = 'Nhiệm vụ đang được kỹ thuật viên sửa chữa.'
          break
        case 'Fixed':
          worklogStatus = 'CONFIRM_NO_PENDING_ISSUES'
          worklog_title = 'Nhiệm vụ đã được sửa chữa'
          worklog_description = 'Nhiệm vụ đã được sửa chữa và đang chờ xác nhận không còn vấn đề.'
          break
        case 'Confirmed':
          worklogStatus = 'FINAL_REVIEW'
          worklog_title = 'Nhiệm vụ đã được xác nhận'
          worklog_description = 'Nhiệm vụ đã được xác nhận và đang trong quá trình xem xét cuối cùng.'
          break
        case 'Reassigned':
          worklogStatus = 'CANCELLED'
          worklog_title = 'Nhiệm vụ đã được phân công lại'
          worklog_description = 'Nhiệm vụ đã được phân công lại cho kỹ thuật viên khác.'
          break
        case 'Unverified':
          worklogStatus = 'CANCELLED'
          worklog_title = 'Nhiệm vụ không được xác minh'
          worklog_description = 'Nhiệm vụ không thể được xác minh và cần được xem xét lại.'
          break
        case 'Notcompleted':
          worklogStatus = 'CANCELLED'
          worklog_title = 'Nhiệm vụ không hoàn thành'
          worklog_description = 'Nhiệm vụ không thể hoàn thành và đã bị hủy.'
          break
        default:
          worklogStatus = 'INIT_INSPECTION' // Default status
          worklog_title = 'Cập nhật trạng thái nhiệm vụ'
          worklog_description = `Trạng thái nhiệm vụ đã được cập nhật thành ${payload.status}.`
      }

      // 4. Create a worklog entry for this status change
      const newWorkLog = await this.prisma.workLog.create({
        data: {
          task_id: taskAssignment.task_id, // Use the task_id from the task assignment
          title: worklog_title,
          description: worklog_description,
          status: worklogStatus
        }
      })

      // 5. Return the updated task assignment and the new worklog
      return {
        success: true,
        message: 'Task assignment status updated and worklog created successfully',
        data: {
          taskAssignment: updatedTaskAssignment,
          worklog: newWorkLog
        }
      }
    } catch (error) {
      console.error('Error updating task assignment status and creating worklog:', error)
      if (error instanceof RpcException) {
        throw error
      }
      throw new RpcException({
        statusCode: error.statusCode || 400,
        message: error.message || 'Failed to update task assignment and create worklog'
      })
    }
  }
}