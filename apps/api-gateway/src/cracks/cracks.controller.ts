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
  UseInterceptors
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { FilesInterceptor } from '@nestjs/platform-express'
import { catchError, firstValueFrom } from 'rxjs'
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto'
import { CreateCrackDetailDto } from '../../../../libs/contracts/src/cracks/create-crack-detail.dto'
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger'
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard'


@Controller('cracks')
@UseGuards(PassportJwtAuthGuard)
@ApiTags('cracks')
// @UseGuards(PassportJwtAuthGuard)
export class CracksController {
  constructor(@Inject('CRACK_SERVICE') private readonly crackService: ClientProxy) { }

  @Get('crack-reports')
  @ApiOperation({ summary: 'Get all crack reports with pagination, search, and filter' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'nứt ngang' })
  @ApiQuery({ name: 'severityFilter', required: false, example: 'high' })
  @ApiResponse({ status: 200, description: 'Returns paginated crack reports' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAllCrackReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('severityFilter') severityFilter?: string
  ) {
    return firstValueFrom(
      this.crackService.send(
        { cmd: 'get-all-crack-report' },
        {
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          search: search || '',
          severityFilter
        }
      ).pipe(
        catchError(err => {
          throw new InternalServerErrorException(err.message)
        })
      )
    )
  }


  @Get('crack-reports/:id')
  @ApiOperation({ summary: 'Get crack report by ID' })
  @ApiParam({ name: 'id', description: 'Crack report ID' })
  @ApiResponse({ status: 200, description: 'Returns the crack report' })
  @ApiResponse({ status: 404, description: 'Crack report not found' })
  async getCrackReportById(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-crack-report-by-id' }, id).pipe(
        catchError(err => {
          throw new NotFoundException(err.message)
        })
      )
    )
  }

  @Post('crack-reports')
  @ApiOperation({ summary: 'Create a new crack report' })
  @ApiBody({ type: AddCrackReportDto })
  @ApiResponse({ status: 201, description: 'Crack report created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createCrackReport(@Body() dto: AddCrackReportDto, @Req() req) {
    const userId = req.user.userId // ✅ Lấy UserID từ token

    return firstValueFrom(
      this.crackService.send({ cmd: 'create-crack-report' }, { dto, userId }).pipe(
        catchError(err => {
          throw new BadRequestException(err.message)
        })
      )
    )
  }


  @Patch('crack-reports/:id')
  @ApiOperation({ summary: 'Update a crack report' })
  @ApiParam({ name: 'id', description: 'Crack report ID' })
  @ApiBody({ type: UpdateCrackReportDto })
  @ApiResponse({ status: 200, description: 'Crack report updated successfully' })
  @ApiResponse({ status: 404, description: 'Crack report not found' })
  async updateCrackReport(@Param('id') id: string, @Body() dto: UpdateCrackReportDto) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'update-crack-report' }, { crackId: id, dto }).pipe(
        catchError(err => {
          throw new NotFoundException(err.message)
        })
      )
    )
  }

  @Delete('crack-reports/:id')
  @ApiOperation({ summary: 'Delete a crack report' })
  @ApiParam({ name: 'id', description: 'Crack report ID' })
  @ApiResponse({ status: 200, description: 'Crack report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Crack report not found' })
  async deleteCrackReport(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'delete-crack-report' }, id).pipe(
        catchError(err => {
          throw new NotFoundException(err.message)
        })
      )
    )
  }

  @Patch('crack-reports/:id/status')
  @ApiOperation({ summary: 'Update crack report status' })
  @ApiParam({ name: 'id', description: 'Crack report ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateCrackReportStatus(
    @Param('id') id: string,
    @Req() req
  ) {
    const managerId = req.user.userId // Get manager ID from token

    return firstValueFrom(
      this.crackService.send(
        { cmd: 'update-crack-report-status' },
        {
          crackReportId: id,
          managerId
        }
      ).pipe(
        catchError(err => {
          throw new BadRequestException(err.message)
        })
      )
    )
  }

  //Crack-Details
  @Get('crack-details')
  @ApiOperation({ summary: 'Get all crack details' })
  @ApiResponse({ status: 200, description: 'Returns all crack details' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAllCrackDetails() {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-all-crack-details' }, {}).pipe(
        catchError(err => {
          throw new InternalServerErrorException(err.message)
        })
      )
    )
  }

  @Get('crack-details/:id')
  @ApiOperation({ summary: 'Get crack detail by ID' })
  @ApiParam({ name: 'id', description: 'Crack detail ID' })
  @ApiResponse({ status: 200, description: 'Returns the crack detail' })
  @ApiResponse({ status: 404, description: 'Crack detail not found' })
  async getCrackDetailsById(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-crack-detail-by-id' }, id).pipe(
        catchError(err => {
          throw new NotFoundException(err.message)
        })
      )
    )
  }

  @Post('crack-details')
  @ApiOperation({ summary: 'Create a new crack detail' })
  @ApiBody({ type: CreateCrackDetailDto })
  @ApiResponse({ status: 201, description: 'Crack detail created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Referenced entity not found' })
  async createCrackDetails(@Body() dto: CreateCrackDetailDto) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'create-crack-detail' }, dto).pipe(
        catchError(err => {
          if (err.response.isSuccess == false) {
            throw new NotFoundException(err.response.message)
          }
          throw new BadRequestException(err.response?.message || 'Lỗi hệ thống, vui lòng thử lại sau')
        })
      )
    )
  }


  @Patch('crack-details/:id')
  @ApiOperation({ summary: 'Update a crack detail' })
  @ApiParam({ name: 'id', description: 'Crack detail ID' })
  @ApiBody({ type: UpdateCrackReportDto })
  @ApiResponse({ status: 200, description: 'Crack detail updated successfully' })
  @ApiResponse({ status: 404, description: 'Crack detail not found' })
  async updateCrackDetails(@Param('id') id: string, @Body() dto: UpdateCrackReportDto) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'update-crack-detail' }, { crackId: id, dto }).pipe(
        catchError(err => {
          throw new NotFoundException(err.message)
        })
      )
    )
  }

  @Delete('crack-details/:id')
  @ApiOperation({ summary: 'Delete a crack detail' })
  @ApiParam({ name: 'id', description: 'Crack detail ID' })
  @ApiResponse({ status: 200, description: 'Crack detail deleted successfully' })
  @ApiResponse({ status: 404, description: 'Crack detail not found' })
  async deleteCrackDetails(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'delete-crack-detail' }, id).pipe(
        catchError(err => {
          throw new NotFoundException(err.message)
        })
      )
    )
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
            format: 'binary' // Hiển thị chọn file trong Swagger
          }
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - No files uploaded' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseInterceptors(FilesInterceptor('image', 10))
  async uploadImage(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded')
    }

    // Chuyển Buffer thành Base64
    const filesWithBase64 = files.map(file => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer.toString('base64'), // Convert buffer to Base64
    }))

    return firstValueFrom(
      this.crackService.send({ cmd: 'upload-crack-images' }, { files: filesWithBase64 }).pipe(
        catchError(err => {
          throw new InternalServerErrorException(err.message)
        })
      )
    )
  }

}
