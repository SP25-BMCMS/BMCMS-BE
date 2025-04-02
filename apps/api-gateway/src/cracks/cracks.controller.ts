import { $Enums } from '@prisma/client-cracks';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FilesInterceptor } from '@nestjs/platform-express';
import { catchError, firstValueFrom, tap } from 'rxjs';
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto';
import { CreateCrackDetailDto } from '../../../../libs/contracts/src/cracks/create-crack-detail.dto';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard';
import { CRACK_CLIENT } from '../constraints';

@Controller('cracks')
@ApiTags('cracks')
// @UseGuards(PassportJwtAuthGuard)
@UseGuards(PassportJwtAuthGuard)
@ApiBearerAuth('access-token')
export class CracksController {
  constructor(
    @Inject(CRACK_CLIENT) private readonly crackService: ClientProxy,
  ) { }

  @Get('test-users-connection')
  @ApiOperation({ summary: 'Test connection with Users Service' })
  @ApiResponse({ status: 200, description: 'Connection test successful' })
  @ApiResponse({ status: 500, description: 'Connection test failed' })
  async testUsersConnection() {
    return firstValueFrom(
      this.crackService.send('crack-reports.test-users-connection', {}).pipe(
        catchError((err) => {
          throw new InternalServerErrorException(err.message);
        }),
      ),
    );
  }

  @Get('crack-reports')
  @ApiOperation({
    summary: 'Get all crack reports with pagination, search, and filter',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'nứt ngang' })
  @ApiQuery({ name: 'severityFilter', required: false, example: 'Unknown' })
  @ApiResponse({ status: 200, description: 'Returns paginated crack reports' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAllCrackReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('severityFilter') severityFilter?: $Enums.Severity,
  ) {
    return firstValueFrom(
      this.crackService
        .send(
          { cmd: 'get-all-crack-report' },
          {
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            search: search || '',
            severityFilter,
          },
        )
        .pipe(
          tap((data) => console.log('Data received from microservice:', data)), // Log dữ liệu
          catchError((err) => {
            console.error('Error from microservice:', err); // Log lỗi
            throw new InternalServerErrorException(err.message);
          }),
        ),
    );
  }

  @Get('crack-reports/:id')
  @ApiOperation({ summary: 'Get crack report by ID with all associated crack details' })
  @ApiParam({ name: 'id', description: 'Crack report ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the crack report with all crack details',
    schema: {
      example: {
        isSuccess: true,
        message: 'Crack Report đã tìm thấy',
        data: [{
          crackReportId: "1234abcd-5678-efgh-9012-ijkl3456mnop",
          buildingDetailId: "c5fa23cc-86d4-4514-b4e5-3f9bce511c29",
          description: "Kiểm tra nứt tường",
          isPrivatesAsset: false,
          position: "rainbow/s106/15/left",
          status: "Pending",
          reportedBy: "user-id",
          verifiedBy: "123123123",
          createdAt: "2024-03-21T10:00:00Z",
          updatedAt: "2024-03-21T10:00:00Z",
          crackDetails: [
            {
              crackDetailsId: "uuid-1",
              crackReportId: "1234abcd-5678-efgh-9012-ijkl3456mnop",
              photoUrl: "https://bucket-name.s3.amazonaws.com/uploads/photo1.jpg",
              severity: "Medium",
              aiDetectionUrl: "https://bucket-name.s3.amazonaws.com/annotated/photo1.jpg",
              createdAt: "2024-03-21T10:00:00Z",
              updatedAt: "2024-03-21T10:00:00Z"
            },
            {
              crackDetailsId: "uuid-2",
              crackReportId: "1234abcd-5678-efgh-9012-ijkl3456mnop",
              photoUrl: "https://bucket-name.s3.amazonaws.com/uploads/photo2.jpg",
              severity: "Low",
              aiDetectionUrl: "https://bucket-name.s3.amazonaws.com/annotated/photo2.jpg",
              createdAt: "2024-03-21T10:00:00Z",
              updatedAt: "2024-03-21T10:00:00Z"
            }
          ]
        }]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Crack report not found' })
  async getCrackReportById(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-crack-report-by-id' }, id).pipe(
        catchError((err) => {
          throw new NotFoundException(err.message);
        }),
      ),
    );
  }

  @Post('crack-reports')
  @ApiOperation({ summary: 'Create a new crack report' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: AddCrackReportDto,
    description: 'Create a new crack report with images',
    schema: {
      type: 'object',
      properties: {
        buildingDetailId: {
          type: 'string',
          example: 'c5fa23cc-86d4-4514-b4e5-3f9bce511c29',
          description: 'The unique identifier of the building detail'
        },
        description: {
          type: 'string',
          example: 'Kiểm tra nứt tường',
          description: 'Description of the crack report'
        },
        isPrivatesAsset: {
          type: 'boolean',
          example: false,
          description: 'Indicates whether the building asset is a private asset'
        },
        position: {
          type: 'string',
          example: 'rainbow/s106/15/left',
          description: 'Position of the crack or asset in the building'
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array of crack images',
          example: ['file1.jpg', 'file2.jpg']
        }
      },
      required: ['buildingDetailId', 'description', 'isPrivatesAsset', 'files']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Crack report created successfully',
    schema: {
      example: {
        isSuccess: true,
        message: 'Crack Report and Crack Details created successfully',
        data: [{
          crackReport: {
            crackReportId: "uuid",
            buildingDetailId: "c5fa23cc-86d4-4514-b4e5-3f9bce511c29",
            description: "Kiểm tra nứt tường",
            isPrivatesAsset: false,
            position: "rainbow/s106/15/left",
            status: "Pending",
            reportedBy: "user-id",
            verifiedBy: "123123123",
            createdAt: "2024-03-21T10:00:00Z",
            updatedAt: "2024-03-21T10:00:00Z"
          },
          crackDetails: [
            {
              crackDetailsId: "uuid",
              crackReportId: "uuid",
              photoUrl: "https://kane-20250314-bmcms.s3.amazonaws.com/uploads/26a19f85-74a4-418e-b0e7-79c118d20bd1.jpg",
              severity: "Medium",
              aiDetectionUrl: "https://kane-20250314-bmcms.s3.amazonaws.com/annotated/26a19f85-74a4-418e-b0e7-79c118d20bd1.jpg",
              createdAt: "2024-03-21T10:00:00Z",
              updatedAt: "2024-03-21T10:00:00Z"
            }
          ]
        }]
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid position format or duplicate data',
    schema: {
      example: {
        statusCode: 400,
        message: "Invalid position format. Expected format: 'area/building/floor/direction'",
        error: "Bad Request"
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Building detail not found',
    schema: {
      example: {
        statusCode: 404,
        message: "BuildingDetailId not found with id = c5fa23cc-86d4-4514-b4e5-3f9bce511c29",
        error: "Not Found"
      }
    }
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async createCrackReport(
    @Body() dto: AddCrackReportDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req
  ) {
    const userId = req.user.userId;

    // Convert file buffers to base64 for transport over RabbitMQ
    const processedFiles = files.map(file => ({
      ...file,
      buffer: file.buffer.toString('base64')
    }));

    dto.files = processedFiles;

    return firstValueFrom(
      this.crackService
        .send({ cmd: 'create-crack-report' }, { dto, userId })
        .pipe(
          catchError((err) => {
            console.error('Error in API Gateway:', err);
            if (err.status === 404) {
              throw new NotFoundException(err.message);
            }
            throw new BadRequestException(err.message);
          }),
        ),
    );
  }

  @Patch('crack-reports/:id')
  @ApiOperation({ summary: 'Update a crack report' })
  @ApiParam({ name: 'id', description: 'Crack report ID' })
  @ApiBody({ type: UpdateCrackReportDto })
  @ApiResponse({
    status: 200,
    description: 'Crack report updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Crack report not found' })
  async updateCrackReport(
    @Param('id') id: string,
    @Body() dto: UpdateCrackReportDto,
  ) {
    return firstValueFrom(
      this.crackService
        .send({ cmd: 'update-crack-report' }, { crackId: id, dto })
        .pipe(
          catchError((err) => {
            throw new NotFoundException(err.message);
          }),
        ),
    );
  }

  @Delete('crack-reports/:id')
  @ApiOperation({ summary: 'Delete a crack report' })
  @ApiParam({ name: 'id', description: 'Crack report ID' })
  @ApiResponse({
    status: 200,
    description: 'Crack report deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Crack report not found' })
  async deleteCrackReport(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'delete-crack-report' }, id).pipe(
        catchError((err) => {
          throw new NotFoundException(err.message);
        }),
      ),
    );
  }

  @Patch('crack-reports/:id/status')
  @ApiOperation({ summary: 'Update crack report status' })
  @ApiParam({ name: 'id', description: 'Crack report ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        staffId: {
          type: 'string',
          description: 'ID of the staff member to assign the task to'
        }
      },
      required: ['staffId']
    }
  })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateCrackReportStatus(
    @Param('id') id: string,
    @Body('staffId') staffId: string,
    @Req() req
  ) {
    const managerId = req.user.userId; // Get manager ID from token

    return firstValueFrom(
      this.crackService
        .send(
          { cmd: 'update-crack-report-status' },
          {
            crackReportId: id,
            managerId,
            staffId
          },
        )
        .pipe(
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );
  }

  //Crack-Details
  @Get('crack-details')
  @ApiOperation({ summary: 'Get all crack details' })
  @ApiResponse({ status: 200, description: 'Returns all crack details' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAllCrackDetails() {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-all-crack-details' }, {}).pipe(
        catchError((err) => {
          throw new InternalServerErrorException(err.message);
        }),
      ),
    );
  }

  @Get('crack-details/:id')
  @ApiOperation({ summary: 'Get crack detail by ID' })
  @ApiParam({ name: 'id', description: 'Crack detail ID' })
  @ApiResponse({ status: 200, description: 'Returns the crack detail' })
  @ApiResponse({ status: 404, description: 'Crack detail not found' })
  async getCrackDetailsById(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-crack-detail-by-id' }, id).pipe(
        catchError((err) => {
          throw new NotFoundException(err.message);
        }),
      ),
    );
  }

  @Post('crack-details')
  @ApiOperation({ summary: 'Create a new crack detail' })
  @ApiBody({ type: CreateCrackDetailDto })
  @ApiResponse({
    status: 201,
    description: 'Crack detail created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Referenced entity not found' })
  async createCrackDetails(@Body() dto: CreateCrackDetailDto) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'create-crack-detail' }, dto).pipe(
        catchError((err) => {
          if (err.response.isSuccess == false) {
            throw new NotFoundException(err.response.message);
          }
          throw new BadRequestException(
            err.response?.message || 'Lỗi hệ thống, vui lòng thử lại sau',
          );
        }),
      ),
    );
  }

  @Patch('crack-details/:id')
  @ApiOperation({ summary: 'Update a crack detail' })
  @ApiParam({ name: 'id', description: 'Crack detail ID' })
  @ApiBody({ type: UpdateCrackReportDto })
  @ApiResponse({
    status: 200,
    description: 'Crack detail updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Crack detail not found' })
  async updateCrackDetails(
    @Param('id') id: string,
    @Body() dto: UpdateCrackReportDto,
  ) {
    return firstValueFrom(
      this.crackService
        .send({ cmd: 'update-crack-detail' }, { crackId: id, dto })
        .pipe(
          catchError((err) => {
            throw new NotFoundException(err.message);
          }),
        ),
    );
  }

  @Delete('crack-details/:id')
  @ApiOperation({ summary: 'Delete a crack detail' })
  @ApiParam({ name: 'id', description: 'Crack detail ID' })
  @ApiResponse({
    status: 200,
    description: 'Crack detail deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Crack detail not found' })
  async deleteCrackDetails(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'delete-crack-detail' }, id).pipe(
        catchError((err) => {
          throw new NotFoundException(err.message);
        }),
      ),
    );
  }

  @Post('crack-details/upload-images')
  @ApiOperation({ summary: 'Upload crack images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload up to 10 images',
    type: 'multipart/form-data',
    required: true,
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary', // Hiển thị chọn file trong Swagger
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - No files uploaded' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseInterceptors(FilesInterceptor('image', 10))
  async uploadImage(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Chuyển Buffer thành Base64
    const filesWithBase64 = files.map((file) => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer.toString('base64'), // Convert buffer to Base64
    }));

    return firstValueFrom(
      this.crackService
        .send({ cmd: 'upload-crack-images' }, { files: filesWithBase64 })
        .pipe(
          catchError((err) => {
            throw new InternalServerErrorException(err.message);
          }),
        ),
    );
  }
}
