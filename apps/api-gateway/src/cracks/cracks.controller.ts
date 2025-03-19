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
  Req,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { FilesInterceptor } from '@nestjs/platform-express'
import { catchError, firstValueFrom } from 'rxjs'
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto'
import { CreateCrackDetailDto } from '../../../../libs/contracts/src/cracks/create-crack-detail.dto'
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto'


@Controller('cracks')
// @UseGuards(PassportJwtAuthGuard)
export class CracksController {
  constructor(@Inject('CRACK_SERVICE') private readonly crackService: ClientProxy) { }

  @Get('crack-reports')
  async getAllCrackReports() {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-all-crack-report' }, {}).pipe(
        catchError(err => {
          throw new InternalServerErrorException(err.message)
        })
      )
    )
  }

  @Get('crack-reports/:id')
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
