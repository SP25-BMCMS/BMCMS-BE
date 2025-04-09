import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc, ClientProxy, RpcException } from '@nestjs/microservices';
import { AssignmentStatus, PrismaClient } from '@prisma/client-Task';
import { CreateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/create-taskAssigment.dto';
import { UpdateTaskAssignmentDto } from 'libs/contracts/src/taskAssigment/update.taskAssigment';
import { PrismaService } from '../../users/prisma/prisma.service';
import {
  PaginationParams,
  PaginationResponseDto,
} from '../../../libs/contracts/src/Pagination/pagination.dto';
import { ApiResponse } from '@nestjs/swagger';
import { firstValueFrom, Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as https from 'https';
import axios from 'axios';
const PDFDocument = require('pdfkit');
const CRACK_PATTERNS = {
  GET_DETAILS: { cmd: 'get-crack-report-by-id' }
};

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
  private s3: S3Client;
  private bucketName: string;

  constructor(
    @Inject('USERS_CLIENT') private readonly usersClient: ClientGrpc,
    @Inject('CRACK_CLIENT') private readonly crackClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {
    this.userService = this.usersClient.getService<UserService>('UserService');

    // Initialize S3 client
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
  }

  // Hàm trích xuất file key từ URL
  private extractFileKey(urlString: string): string {
    try {
      const url = new URL(urlString);
      return url.pathname.substring(1); // Bỏ dấu '/' đầu tiên
    } catch (error) {
      console.error('URL không hợp lệ:', urlString);
      throw new Error('Định dạng URL không đúng');
    }
  }

  // Hàm tạo presigned URL
  async getPreSignedUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 }); // URL hết hạn sau 1 giờ
  }

  /**
   * Generate fresh presigned URL for an S3 object
   * @param imageUrl Original S3 URL (can be expired)
   * @returns Fresh presigned URL
   */
  private async refreshPresignedUrl(imageUrl: string): Promise<string> {
    try {
      // Extract the path from URL
      let path = '';

      // Clean URL if enclosed in curly braces
      let cleanUrl = imageUrl;
      if (imageUrl.startsWith('{') && imageUrl.endsWith('}')) {
        cleanUrl = imageUrl.substring(1, imageUrl.length - 1);
      }

      // Parse the URL to extract the S3 path
      const urlObj = new URL(cleanUrl);
      path = urlObj.pathname.substring(1); // Remove leading slash

      console.log('Refreshing presigned URL for path:', path);

      // Create a new presigned URL
      return await this.getPreSignedUrl(path);
    } catch (error) {
      console.error('Error refreshing presigned URL:', error);
      // Return original URL if we can't refresh it
      return imageUrl;
    }
  }

  // Helper method to fetch image as buffer from URL with auto-refresh of expired URLs
  private async getImageBufferFromUrl(url: string): Promise<Buffer> {
    try {
      console.log('Attempting to load image from URL:', url);

      // Make sure URL is properly formatted for axios
      // Some URLs might be enclosed in curly braces, remove them if present
      let cleanUrl = url;
      if (url.startsWith('{') && url.endsWith('}')) {
        cleanUrl = url.substring(1, url.length - 1);
      }

      console.log('Cleaned URL:', cleanUrl);

      // First attempt with the original URL
      try {
        const response = await axios.get(cleanUrl, {
          responseType: 'arraybuffer',
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true
          }),
          maxContentLength: 10 * 1024 * 1024, // 10MB limit
          timeout: 15000 // 15 second timeout
        });

        console.log('Image downloaded successfully, size:', response.data.length);
        return Buffer.from(response.data);
      } catch (firstError) {
        // If 403 Forbidden (expired URL), try to refresh the URL
        if (firstError.response && firstError.response.status === 403) {
          console.log('URL has expired, refreshing...');
          const refreshedUrl = await this.refreshPresignedUrl(cleanUrl);
          console.log('Refreshed URL:', refreshedUrl);

          // Try again with the refreshed URL
          const response = await axios.get(refreshedUrl, {
            responseType: 'arraybuffer',
            httpsAgent: new https.Agent({
              rejectUnauthorized: false,
              keepAlive: true
            }),
            maxContentLength: 10 * 1024 * 1024,
            timeout: 15000
          });

          console.log('Image downloaded successfully with refreshed URL, size:', response.data.length);
          return Buffer.from(response.data);
        } else {
          // If not a 403 error, rethrow
          throw firstError;
        }
      }
    } catch (error) {
      console.error('Error fetching image:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', JSON.stringify(error.response.headers));
      }
      throw error;
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
      });
      return {
        statusCode: 201,
        message: 'Task assignment created successfully',
        data: newAssignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment creation failed',
      });
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
      });
      return {
        statusCode: 200,
        message: 'Task assignment updated successfully',
        data: updatedAssignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment update failed',
      });
    }
  }

  async deleteTaskAssignment(taskAssignmentId: string) {
    try {
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id: taskAssignmentId },
        data: { status: AssignmentStatus.Notcompleted }, // Change status to 'notcompleted'
      });
      return {
        statusCode: 200,
        message: 'Task assignment marked as not completed',
        data: updatedAssignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Task assignment update failed',
      });
    }
  }
  async getTaskAssignmentByUserId(userId: string) {
    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: { employee_id: userId },
      });
      return {
        statusCode: 200,
        message: 'Task assignments fetched successfully',
        data: assignments,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments for user',
      });
    }
  }

  async getTaskAssignmentById(taskAssignmentId: string) {
    try {
      console.log('Finding task assignment with ID:', taskAssignmentId);
      const assignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignmentId },
      });
      if (!assignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }
      return {
        statusCode: 200,
        message: 'Task assignment fetched successfully',
        data: assignment,
      };
    } catch (error) {
      console.error('Error in getTaskAssignmentById:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignment',
      });
    }
  }

  async getAllTaskAssignments(
    paginationParams: PaginationParams = { page: 1, limit: 10 },
  ): Promise<PaginationResponseDto<any>> {
    try {
      const page = Number(paginationParams.page) || 1;
      const limit = Number(paginationParams.limit) || 10;
      const skip = (page - 1) * limit;
      const statusFilter = paginationParams.statusFilter;

      // Build where clause for filtering
      const whereClause = statusFilter ? { status: statusFilter as AssignmentStatus } : {};

      // Get total count with filter
      const total = await this.prisma.taskAssignment.count({
        where: whereClause,
      });

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
      });

      const responseData = {
        statusCode: 200,
        message: 'Danh sách phân công công việc',
        data: taskAssignments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      return responseData;
    } catch (error) {
      console.error('Error in getAllTaskAssignments:', error);
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
      };

      return errorData;
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
      });
      if (existingAssignment.employee_id == newEmployeeId) {
        throw new RpcException({
          statusCode: 404,
          message: 'New employee is the same as the old employee please choose another employee',
        });
      }

      if (!existingAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
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
      });

      // Tạo assignment mới với dữ liệu từ assignment cũ nhưng employee mới
      const newAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: existingAssignment.task_id,
          employee_id: newEmployeeId,
          description: `Reassigned from assignment ${taskAssignmentId}\n Original description: ${existingAssignment.description}`,
          status: AssignmentStatus.Pending,
        },
        include: {
          task: true
        }
      });

      return {
        statusCode: 200,
        message: 'Task reassigned successfully',
        data: {
          oldAssignment,
          newAssignment
        }
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Error reassigning task assignment: ' + error.message
      });
    }
  }

  async changeTaskAssignmentStatus(assignment_id: string, status: AssignmentStatus) {
    try {
      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id },
      });

      if (!existingAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }

      // Cập nhật trạng thái
      const updatedAssignment = await this.prisma.taskAssignment.update({
        where: { assignment_id },
        data: { status },
        include: {
          task: true,
        },
      });

      return {
        statusCode: 200,
        message: `Task assignment status changed to ${status} successfully`,
        data: updatedAssignment,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: `Failed to change task assignment status: ${error.message}`,
      });
    }
  }

  async getTaskAssignmentByStatus(status: AssignmentStatus) {
    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: { status },
      });
      return {
        statusCode: 200,
        message: 'Task assignments by status fetched successfully',
        data: assignments,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignments by status',
      });
    }
  }

  async assignTaskToEmployee(taskId: string, employeeId: string, description: string) {
    try {
      // Check if the employee has any unconfirmed tasks
      const unconfirmedTasks = await this.prisma.taskAssignment.findMany({
        where: {
          employee_id: employeeId,
          status: {
            notIn: [AssignmentStatus.Confirmed]
          }
        }
      });

      if (unconfirmedTasks.length > 0) {
        return {
          statusCode: 400,
          message: 'Staff has unconfirmed tasks. Cannot assign new task.',
          data: null
        };
      }

      // Check if the task exists
      const task = await this.prisma.task.findUnique({
        where: { task_id: taskId }
      });

      if (!task) {
        return {
          statusCode: 404,
          message: 'Task not found',
          data: null
        };
      }

      // Create new task assignment
      const newAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: taskId,
          employee_id: employeeId,
          description: description,
          status: AssignmentStatus.Pending
        }
      });

      return {
        statusCode: 201,
        message: 'Task assigned to employee successfully',
        data: newAssignment
      };
    } catch (error) {
      console.error('Error assigning task to employee:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to assign task to employee',
        error: error.message
      });
    }
  }

  async getTaskAssignmentByTaskId(taskId: string) {
    try {
      const assignment = await this.prisma.task.findUnique({
        where: { task_id: taskId },
        include: {
          taskAssignments: true,
        },
      });
      if (!assignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }
      return {
        statusCode: 200,
        message: 'Task assignment fetched successfully',
        data: assignment,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: 'Error fetching task assignment',
      });
    }
  }

  async getDetails(taskAssignment_id: string) {
    try {
      // 1. Get inspection with task assignment
      const taskAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id: taskAssignment_id },
        include: {
          task: true
        }
      });
      if (!taskAssignment) {
        return {
          success: false,
          message: 'taskAssignment not found',
          data: null
        };
      }

      const result: any = {
        assignment_id: taskAssignment.assignment_id,
        task_id: taskAssignment.task_id,
        description: taskAssignment.description,
        employee: null, // Placeholder for employee info
        status: taskAssignment.status,
        created_at: taskAssignment.created_at,
        updated_at: taskAssignment.updated_at,
        task: taskAssignment.task
      };

      // 2. Get task info
      const task = taskAssignment.task;
      console.log(task);

      // 3. If crack_id exists, get crack info
      if (task.crack_id) {
        console.log("🚀 ~ InspectionsService ~ getInspectionDetails ~ task.crack_id:", task.crack_id)
        const crackInfo = await firstValueFrom(
          this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
        );
        result.crackInfo = crackInfo;
      }

      // 4. Get employee info from User service
      try {
        const employeeInfo = await firstValueFrom(
          this.userService.GetUserByIdForTaskAssignmentDetail({ userId: taskAssignment.employee_id })
        );

        if (employeeInfo && employeeInfo.isSuccess && employeeInfo.data) {
          result.employee = {
            employee_id: employeeInfo.data.userId,
            username: employeeInfo.data.username
          };
        }
      } catch (error) {
        console.error('Error getting employee details:', error.message);
        result.employee = {
          employee_id: taskAssignment.employee_id,
          username: 'Unknown'
        };
      }

      // 5. If schedule_id exists, get schedule info (you can add this later)
      if (task.schedule_job_id) {
        // Add schedule info retrieval here
      }

      return {
        success: true,
        message: 'Inspection details retrieved successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error retrieving inspection details',
        data: error.message
      };
    }
  }

  async updateStatusTaskAssignmentToReassigned(assignment_id: string, description: string) {
    try {
      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await this.prisma.taskAssignment.findUnique({
        where: { assignment_id },
      });

      if (!existingAssignment) {
        throw new RpcException({
          statusCode: 404,
          message: 'Task assignment not found',
        });
      }

      // Kiểm tra xem status hiện tại có phải là InFixing hoặc Fixed không
      if (existingAssignment.status !== AssignmentStatus.InFixing &&
        existingAssignment.status !== AssignmentStatus.Fixed) {
        throw new RpcException({
          statusCode: 400,
          message: 'Task assignment status must be InFixing or Fixed to reassign',
        });
      }

      // Nối chuỗi description mới với description hiện tại
      const updatedDescription =
        `${existingAssignment.description}\n---\nReassigned reason: ${description}`;

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
      });

      return {
        statusCode: 200,
        message: 'Task assignment status changed to Reassigned successfully',
        data: updatedAssignment,
      };
    } catch (error) {
      // Nếu lỗi là RpcException, ném lại nguyên vẹn
      if (error instanceof RpcException) {
        throw error;
      }

      // Xử lý các lỗi khác, trả về 400 thay vì 500
      throw new RpcException({
        statusCode: 400,
        message: `Failed to change task assignment status: ${error.message}`,
      });
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
      });

      if (taskAssignments.length === 0) {
        return {
          statusCode: 200,
          message: 'No task assignments found for this employee',
          data: [],
        };
      }

      return {
        statusCode: 200,
        message: 'Tasks and assignments fetched successfully',
        data: taskAssignments,
      };
    } catch (error) {
      console.error('Error fetching tasks and assignments for employee:', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to fetch tasks and assignments for employee',
        error: error.message,
      });
    }
  }

  /**
   * Export cost PDF report comparing estimated vs. actual costs
   * @param taskId The ID of the task
   * @returns PDF file as base64 string
   */
  async exportCostPdf(taskId: string) {
    try {
      console.log('Starting exportCostPdf for task ID:', taskId);

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
                  image_urls: true, // Make sure we're getting the image_urls
                  description: true,
                  created_at: true,
                  updated_at: true,
                  total_cost: true,
                  repairMaterials: {
                    include: {
                      material: true // Join with material table for material details
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!task) {
        console.log('Task not found:', taskId);
        return {
          success: false,
          message: 'Task not found',
          data: null
        };
      }

      console.log('Task found:', task.task_id);

      // 2. Get crack information if available
      let crackInfo = null;
      if (task.crack_id) {
        try {
          crackInfo = await firstValueFrom(
            this.crackClient.send(CRACK_PATTERNS.GET_DETAILS, task.crack_id)
          );
          console.log('Crack info retrieved:', crackInfo?.isSuccess);
        } catch (err) {
          console.error('Failed to get crack details:', err.message);
        }
      }

      // 3. Calculate estimated cost - tổng total_cost những taskAssignment có status === Verified
      let estimatedCost = 0;

      for (const assignment of task.taskAssignments) {
        if (assignment.status === AssignmentStatus.Verified) {
          for (const inspection of assignment.inspections) {
            estimatedCost += Number(inspection.total_cost) || 0;
          }
        }
      }

      console.log('Calculated estimated cost (Verified):', estimatedCost);

      // 4. Calculate actual cost - tổng total_cost những taskAssignment có status === Confirmed
      let actualCost = 0;
      let costDetails = [];

      for (const assignment of task.taskAssignments) {
        if (assignment.status === AssignmentStatus.Confirmed) {
          for (const inspection of assignment.inspections) {
            actualCost += Number(inspection.total_cost) || 0;

            // Get material details for the report
            if (inspection.repairMaterials && inspection.repairMaterials.length > 0) {
              inspection.repairMaterials.forEach(material => {
                // Lấy tên vật liệu từ bảng material nếu có
                const materialName = material.material?.name || 'Unknown Material';

                costDetails.push({
                  name: `Material Name: ${materialName}`,
                  quantity: material.quantity,
                  unitCost: Number(material.unit_cost),
                  totalCost: Number(material.total_cost)
                });
              });
            }
          }
        }
      }

      console.log('Calculated actual cost (Confirmed):', actualCost);
      console.log('Cost details count:', costDetails.length);

      // 5. Generate PDF
      try {
        console.log('Generating PDF...');
        const pdfBuffer = await this.generateCostPdf(task, estimatedCost, actualCost, true, costDetails, crackInfo);
        console.log('PDF generated successfully, buffer size:', pdfBuffer.length);

        // 6. Return base64 encoded PDF
        return {
          success: true,
          message: 'Cost PDF report generated successfully',
          data: pdfBuffer.toString('base64')
        };
      } catch (pdfError) {
        console.error('Error in PDF generation:', pdfError);
        return {
          success: false,
          message: 'Error generating PDF',
          error: pdfError.message
        };
      }
    } catch (error) {
      console.error('Error in exportCostPdf:', error);
      return {
        success: false,
        message: 'Error generating cost PDF report',
        error: error.message
      };
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
        console.log('Initializing PDFDocument...');
        const path = require('path');

        // Define consistent margins
        const PAGE_MARGIN = 40;
        const CONTENT_WIDTH = 515; // A4 width (595) - margins on both sides

        const doc = new PDFDocument({
          autoFirstPage: true,
          size: 'A4',
          margin: PAGE_MARGIN,
          info: {
            Title: 'Inspection Report',
            Author: 'BMCMS',
            Subject: 'Crack Inspection Report',
            Keywords: 'inspection, report, crack',
            CreationDate: new Date()
          }
        });

        const fontPath = path.join('C:', 'CapStone', 'New folder', 'BMCMS-BE', 'apps', 'Tasks', 'fonts', 'Arial.ttf');
        doc.registerFont('VietnameseFont', fontPath);
        doc.font('VietnameseFont');

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          console.log('PDF document ended, resolving promise...');
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        doc.on('error', (err) => {
          console.error('PDF document error:', err);
          reject(err);
        });

        // Track vertical position throughout document
        let yPos = PAGE_MARGIN; // Initialize at top margin
        const LINE_HEIGHT = 18; // Standard line height
        const SECTION_SPACING = 20; // Space between sections

        // Header with blue background
        doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 60)
          .fillAndStroke('#3478F6', '#3478F6');
        yPos += 20;
        doc.fillColor('white')
          .fontSize(16)
          .font('VietnameseFont')
          .text('INSPECTION REPORT', PAGE_MARGIN + 10, yPos, { align: 'left' });

        yPos += 20;
        doc.fontSize(10)
          .text('Generated: ' + new Date().toLocaleString(), PAGE_MARGIN + 10, yPos, { align: 'left' });

        // Reset text color
        doc.fillColor('black');
        yPos += 30; // Move below header

        // Logo placeholder (placed on the right side of header)
        doc.rect(CONTENT_WIDTH - 70, PAGE_MARGIN + 5, 80, 50).stroke();
        doc.text('Logo', CONTENT_WIDTH - 50, PAGE_MARGIN + 25);

        // Section: Crack report information
        yPos += 10;
        doc.fontSize(14)
          .fillColor('#000000')
          .text('Crack Report Information', PAGE_MARGIN, yPos, { underline: true });
        yPos += LINE_HEIGHT + 5;
        doc.fontSize(11);

        // Two-column layout for crack info
        const colWidth = CONTENT_WIDTH / 2 - 10;

        // Lấy thông tin reportby từ crack record
        const reportby = crackInfo?.data && crackInfo.data[0]?.reportedBy?.username || 'N/A';
        const reportDate = crackInfo?.data && crackInfo.data[0]?.createdAt
          ? new Date(crackInfo.data[0].createdAt).toLocaleString()
          : 'N/A';

        // Get severity from first crack detail if available
        const severity = crackInfo?.data && crackInfo.data[0]?.crackDetails && crackInfo.data[0].crackDetails.length > 0
          ? crackInfo.data[0].crackDetails[0].severity
          : 'N/A';

        // Left column
        doc.text('Reporter:', PAGE_MARGIN, yPos);
        doc.text(reportby, PAGE_MARGIN + 100, yPos);
        yPos += LINE_HEIGHT;

        doc.text('Report Date:', PAGE_MARGIN, yPos);
        doc.text(reportDate, PAGE_MARGIN + 100, yPos);
        yPos += LINE_HEIGHT;

        // Right column
        doc.text('Severity Level:', PAGE_MARGIN + colWidth, yPos - LINE_HEIGHT * 2);
        doc.text(severity, PAGE_MARGIN + colWidth + 120, yPos - LINE_HEIGHT * 2);

        doc.text('Payment Confirmed:', PAGE_MARGIN + colWidth, yPos - LINE_HEIGHT);
        doc.text('Confirm', PAGE_MARGIN + colWidth + 120, yPos - LINE_HEIGHT);

        // Description (full width)
        yPos += LINE_HEIGHT;
        doc.text('Description:', PAGE_MARGIN, yPos);
        yPos += LINE_HEIGHT;

        // Description text in a box
        const descriptionText = task.description || 'N/A';
        doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 30).fillAndStroke('#FFFFFF', '#000000');
        doc.fillColor('#000000')
          .fontSize(9)
          .text(descriptionText, PAGE_MARGIN + 5, yPos + 5, {
            width: CONTENT_WIDTH - 10,
            height: 20,
            ellipsis: true
          });
        yPos += 40;

        // Section: Crack Detail Images
        yPos += SECTION_SPACING;
        doc.fontSize(14)
          .fillColor('#000000')
          .text('Crack Detail Images', PAGE_MARGIN, yPos, { underline: true });
        yPos += LINE_HEIGHT + 5;

        // Draw frames for crack detail images
        const crackImageWidth = CONTENT_WIDTH / 2 - 10;
        const crackImageHeight = 100;

        // Box 1 - Original Photo
        doc.rect(PAGE_MARGIN, yPos, crackImageWidth, crackImageHeight).fillAndStroke('#FFFFFF', '#000000');
        doc.fontSize(10).fillColor('#000000').text('Original Photo', PAGE_MARGIN + 5, yPos + 5);

        // Box 2 - AI Detection
        doc.rect(PAGE_MARGIN + crackImageWidth + 20, yPos, crackImageWidth, crackImageHeight).fillAndStroke('#FFFFFF', '#000000');
        doc.fontSize(10).fillColor('#000000').text('AI Detection Photo', PAGE_MARGIN + crackImageWidth + 25, yPos + 5);

        // Add images from crack detail if available
        if (crackInfo?.data && crackInfo.data[0]?.crackDetails && crackInfo.data[0].crackDetails.length > 0) {
          try {
            const crackDetail = crackInfo.data[0].crackDetails[0];

            // Add original photo in first rectangle if available
            if (crackDetail.photoUrl) {
              try {
                // Download the image using axios and add it to the PDF
                const imageBuffer = await this.getImageBufferFromUrl(crackDetail.photoUrl);
                doc.image(imageBuffer, PAGE_MARGIN + 5, yPos + 20, {
                  fit: [crackImageWidth - 10, crackImageHeight - 25],
                  align: 'center',
                  valign: 'center'
                });
              } catch (imgError) {
                console.error('Error adding original photo:', imgError.message);
                doc.text('Error loading original photo', PAGE_MARGIN + 30, yPos + 50);
              }
            } else {
              doc.text('No original photo available', PAGE_MARGIN + 30, yPos + 50);
            }

            // Add AI detection photo in second rectangle if available
            if (crackDetail.aiDetectionUrl) {
              try {
                // Download the image using axios and add it to the PDF
                const aiImageBuffer = await this.getImageBufferFromUrl(crackDetail.aiDetectionUrl);
                doc.image(aiImageBuffer, PAGE_MARGIN + crackImageWidth + 25, yPos + 20, {
                  fit: [crackImageWidth - 10, crackImageHeight - 25],
                  align: 'center',
                  valign: 'center'
                });
              } catch (imgError) {
                console.error('Error adding AI detection photo:', imgError.message);
                doc.text('Error loading AI photo', PAGE_MARGIN + crackImageWidth + 50, yPos + 50);
              }
            } else {
              doc.text('No AI detection photo available', PAGE_MARGIN + crackImageWidth + 50, yPos + 50);
            }
          } catch (imgError) {
            console.error('Error adding images to PDF:', imgError);
            doc.text('Error loading images', PAGE_MARGIN + 30, yPos + 50);
          }
        } else {
          doc.text('No crack details available', PAGE_MARGIN + 30, yPos + 50);
          doc.text('No crack details available', PAGE_MARGIN + crackImageWidth + 50, yPos + 50);
        }

        // Show creation date from the crack detail
        yPos += crackImageHeight + 10;
        if (crackInfo?.data && crackInfo.data[0]?.crackDetails && crackInfo.data[0].crackDetails.length > 0) {
          const crackDetail = crackInfo.data[0].crackDetails[0];
          const creationDate = crackDetail.createdAt
            ? new Date(crackDetail.createdAt).toLocaleString()
            : 'Date not available';
          doc.fontSize(10).text(`Detection Date: ${creationDate}`, PAGE_MARGIN, yPos);
        } else {
          doc.fontSize(10).text('Detection Date: Not available', PAGE_MARGIN, yPos);
        }

        // Section: Inspection Images
        yPos += SECTION_SPACING;
        doc.fontSize(14)
          .fillColor('#000000')
          .text('Inspection Images', PAGE_MARGIN, yPos, { underline: true });
        yPos += LINE_HEIGHT + 5;

        // Status order priority (for sorting)
        const statusOrder = {
          'Verified': 1,
          'Unverified': 2,
          'InFixing': 3,
          'Fixed': 4,
          'Confirmed': 5,
          'Reassigned': 6,
          'Pending': 7
        };

        // Display images from inspections if available
        if (task.taskAssignments && task.taskAssignments.length > 0) {
          let hasImages = false;

          // Collect all inspections from all assignments
          let allInspections = [];

          // Group and flatten all inspections with their task assignment status
          for (const assignment of task.taskAssignments) {
            if (assignment.inspections && assignment.inspections.length > 0) {
              for (const inspection of assignment.inspections) {
                if (inspection.image_urls && Array.isArray(inspection.image_urls) && inspection.image_urls.length > 0) {
                  // Add each inspection with its related assignment status
                  allInspections.push({
                    inspection: inspection,
                    status: assignment.status,
                    assignmentId: assignment.assignment_id
                  });
                  hasImages = true;
                }
              }
            }
          }

          // Sort inspections by task assignment status priority
          allInspections.sort((a, b) => {
            const statusA = statusOrder[a.status] || 999;
            const statusB = statusOrder[b.status] || 999;
            return statusA - statusB;
          });

          if (hasImages) {
            // Now display each inspection in a full-width row
            for (let i = 0; i < allInspections.length; i++) {
              const { inspection, status, assignmentId } = allInspections[i];

              // Check if we need a new page
              if (yPos > 620 && i < allInspections.length - 1) {
                // Add a new page if we're reaching the bottom
                doc.addPage();
                yPos = PAGE_MARGIN + 20;
              }

              // We'll display only the first image from each inspection
              if (inspection.image_urls && inspection.image_urls.length > 0) {
                const imageUrl = inspection.image_urls[0];

                // Create a full-width container for this inspection
                const containerWidth = CONTENT_WIDTH;
                const containerHeight = 180; // Tall enough for image and details

                // Create a status badge with colored background
                let statusColor;
                switch (status) {
                  case 'Verified': statusColor = '#4CAF50'; break; // Green
                  case 'Unverified': statusColor = '#FF9800'; break; // Orange
                  case 'InFixing': statusColor = '#2196F3'; break; // Blue
                  case 'Fixed': statusColor = '#9C27B0'; break; // Purple
                  case 'Confirmed': statusColor = '#00BCD4'; break; // Teal
                  case 'Reassigned': statusColor = '#F44336'; break; // Red
                  default: statusColor = '#9E9E9E'; // Grey
                }

                // Draw container outline with status color
                doc.rect(PAGE_MARGIN, yPos, containerWidth, containerHeight).fillAndStroke('#FFFFFF', statusColor);

                // Header with status and inspection ID
                doc.rect(PAGE_MARGIN, yPos, containerWidth, 20).fillAndStroke('#e6e6e6', statusColor);
                doc.fillColor('#333333').fontSize(10).font('VietnameseFont', 'bold');

                // Format the inspection date
                const inspectionDate = inspection.created_at
                  ? new Date(inspection.created_at).toLocaleDateString()
                  : 'Unknown date';

                // Draw status badge
                const statusWidth = 80;
                doc.rect(PAGE_MARGIN + containerWidth - statusWidth - 5, yPos + 3, statusWidth, 14)
                  .fillAndStroke(statusColor, statusColor);
                doc.fillColor('white').text(status,
                  PAGE_MARGIN + containerWidth - statusWidth - 5 + 5,
                  yPos + 5,
                  { width: statusWidth - 10, align: 'center' }
                );

                // Reset text color and write header
                doc.fillColor('#333333').text(
                  `Inspection (${inspectionDate}) - ID: ${inspection.inspection_id.substring(0, 8)}...`,
                  PAGE_MARGIN + 10,
                  yPos + 5
                );

                // Display the image on the left
                const imageSize = 140;
                try {
                  const inspectionImg = await this.getImageBufferFromUrl(imageUrl);
                  doc.image(inspectionImg, PAGE_MARGIN + 10, yPos + 30, {
                    fit: [imageSize, imageSize],
                    align: 'center',
                    valign: 'center'
                  });

                  // Add image border with status color
                  doc.rect(PAGE_MARGIN + 10, yPos + 30, imageSize, imageSize).stroke(statusColor);
                } catch (imgError) {
                  console.error(`Error loading inspection image:`, imgError.message);
                  doc.text('Error loading image', PAGE_MARGIN + 30, yPos + 70);
                }

                // Reset fill color
                doc.fillColor('black');

                // Add inspection description and details on the right
                const detailsX = PAGE_MARGIN + imageSize + 20;
                const detailsWidth = containerWidth - imageSize - 30;

                // Description title - BOLD & LARGER
                doc.fontSize(11).font('VietnameseFont', 'bold')
                  .fillColor('#000000')
                  .text('Description:', detailsX, yPos + 30);

                // Description content
                doc.fontSize(9).font('VietnameseFont', 'normal')
                  .fillColor('#333333')
                  .text(inspection.description || 'No description available',
                    detailsX,
                    yPos + 45,
                    { width: detailsWidth, height: 40, ellipsis: true }
                  );

                // Materials section - BOLD & LARGER
                doc.fontSize(11).font('VietnameseFont', 'bold')
                  .fillColor('#000000')
                  .text('Materials:', detailsX, yPos + 90);

                // Get materials information if available
                let materialsText = 'No materials information';
                let totalCost = 'N/A';

                if (inspection.repairMaterials && inspection.repairMaterials.length > 0) {
                  materialsText = inspection.repairMaterials.map(material => {
                    const materialName = material.material?.name || 'Unknown Material';
                    return `• ${materialName} (${material.quantity} × ${material.unit_cost.toLocaleString('vi-VN')} VND)`;
                  }).join('\n');

                  // Format the total cost
                  totalCost = `${inspection.total_cost.toLocaleString('vi-VN')} VND`;
                }

                // Materials list
                doc.fontSize(9).font('VietnameseFont', 'normal')
                  .fillColor('#333333')
                  .text(materialsText,
                    detailsX,
                    yPos + 105,
                    { width: detailsWidth, height: 40, ellipsis: true }
                  );

                // Estimated cost - BOLD & LARGER
                doc.fontSize(11).font('VietnameseFont', 'bold')
                  .fillColor('#000000')
                  .text('Estimated Cost:', detailsX, yPos + 150);

                doc.fontSize(10).fillColor('#d32f2f').font('VietnameseFont', 'bold')
                  .text(totalCost, detailsX + 110, yPos + 150);

                // Move position for next inspection
                yPos += containerHeight + 15;
              }
            }
          } else {
            // No images found
            doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 100).fillAndStroke('#FFFFFF', '#000000');
            doc.fontSize(12).text('No inspection images available', PAGE_MARGIN + CONTENT_WIDTH / 2 - 80, yPos + 45);
            yPos += 110;
          }

          // Cost summary section
          yPos += 10;
          doc.fontSize(12)
            .fillColor('#000000')
            .text('Cost Summary:', PAGE_MARGIN, yPos, { underline: true });
          doc.fillColor('black');
          yPos += LINE_HEIGHT + 5;

          // Display cost information
          doc.text(`Total Estimated Cost: ${estimatedCost.toLocaleString('vi-VN')} VND`, PAGE_MARGIN, yPos);
          yPos += LINE_HEIGHT;
          doc.text(`Total Actual Cost: ${actualCost.toLocaleString('vi-VN')} VND`, PAGE_MARGIN, yPos);
          yPos += LINE_HEIGHT;

          // Reset fill color
          doc.fillColor('black');

        } else {
          // No inspections found
          doc.rect(PAGE_MARGIN, yPos, CONTENT_WIDTH, 100).fillAndStroke('#FFFFFF', '#000000');
          doc.fontSize(12).text('No inspection data available', PAGE_MARGIN + CONTENT_WIDTH / 2 - 80, yPos + 45);
          yPos += 110;
        }

        // Footer area - Đảm bảo footer không bị đè lên nội dung
        // Tính toán vị trí footer dựa vào vị trí hiện tại (yPos) + khoảng cách an toàn
        const minFooterY = 700; // Vị trí tối thiểu của footer
        const safetyMargin = 50; // Khoảng cách an toàn giữa nội dung và footer
        const footerY = Math.max(minFooterY, yPos + safetyMargin); // Lấy giá trị lớn hơn giữa minFooterY và yPos + safetyMargin

        // Thêm page mới nếu footer quá gần cuối trang
        if (footerY > 750) {
          doc.addPage();
          const newFooterY = PAGE_MARGIN + 50;
          doc.fontSize(10).text(`Ho Chi Minh, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, PAGE_MARGIN, newFooterY);

          // Signatures
          const sigWidth = 100;
          const sigMargin = (CONTENT_WIDTH - (sigWidth * 3)) / 4;

          // Manager signature
          doc.fillColor('#000000').fontSize(10).font('VietnameseFont', 'bold');
          doc.text('Manager Signature', PAGE_MARGIN + sigMargin, newFooterY + 20, { align: 'center', width: sigWidth });
          doc.rect(PAGE_MARGIN + sigMargin, newFooterY + 40, sigWidth, 50).fillAndStroke('#FFFFFF', '#000000');

          // Leader signature - explicitly set color again
          doc.fillColor('#000000').fontSize(10).font('VietnameseFont', 'bold');
          doc.text('Leader Signature', PAGE_MARGIN + sigMargin * 2 + sigWidth, newFooterY + 20, { align: 'center', width: sigWidth });
          doc.rect(PAGE_MARGIN + sigMargin * 2 + sigWidth, newFooterY + 40, sigWidth, 50).fillAndStroke('#FFFFFF', '#000000');

          // Resident signature - explicitly set color again
          doc.fillColor('#000000').fontSize(10).font('VietnameseFont', 'bold');
          doc.text('Resident Signature', PAGE_MARGIN + sigMargin * 3 + sigWidth * 2, newFooterY + 20, { align: 'center', width: sigWidth });
          doc.rect(PAGE_MARGIN + sigMargin * 3 + sigWidth * 2, newFooterY + 40, sigWidth, 50).fillAndStroke('#FFFFFF', '#000000');
        } else {
          // Hiển thị footer trên trang hiện tại
          doc.fontSize(10).text(`Ho Chi Minh, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, PAGE_MARGIN, footerY);

          // Signatures
          const sigWidth = 100;
          const sigMargin = (CONTENT_WIDTH - (sigWidth * 3)) / 4;

          // Manager signature
          doc.fillColor('#000000').fontSize(10).font('VietnameseFont', 'bold');
          doc.text('Manager Signature', PAGE_MARGIN + sigMargin, footerY + 20, { align: 'center', width: sigWidth });
          doc.rect(PAGE_MARGIN + sigMargin, footerY + 40, sigWidth, 50).fillAndStroke('#FFFFFF', '#000000');

          // Leader signature - explicitly set color again
          doc.fillColor('#000000').fontSize(10).font('VietnameseFont', 'bold');
          doc.text('Leader Signature', PAGE_MARGIN + sigMargin * 2 + sigWidth, footerY + 20, { align: 'center', width: sigWidth });
          doc.rect(PAGE_MARGIN + sigMargin * 2 + sigWidth, footerY + 40, sigWidth, 50).fillAndStroke('#FFFFFF', '#000000');

          // Resident signature - explicitly set color again
          doc.fillColor('#000000').fontSize(10).font('VietnameseFont', 'bold');
          doc.text('Resident Signature', PAGE_MARGIN + sigMargin * 3 + sigWidth * 2, footerY + 20, { align: 'center', width: sigWidth });
          doc.rect(PAGE_MARGIN + sigMargin * 3 + sigWidth * 2, footerY + 40, sigWidth, 50).fillAndStroke('#FFFFFF', '#000000');
        }

        // Reset fill color for remaining content
        doc.fillColor('black');

        console.log('Finalizing PDF...');
        doc.end();

      } catch (err) {
        console.error('Fatal error in PDF generation:', err);
        reject(err);
      }
    });
  }

}


