import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  InternalServerErrorException,
  BadRequestException,
  Param, NotFoundException, Put, Delete, Patch, UseGuards, Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom } from 'rxjs';
import { AddCrackReportDto } from '../../../../libs/contracts/src/cracks/add-crack-report.dto';
import { UpdateCrackReportDto } from '../../../../libs/contracts/src/cracks/update-crack-report.dto';
import { CreateCrackDetailDto } from '../../../../libs/contracts/src/cracks/create-crack-detail.dto';
import { PassportJwtAuthGuard } from '../users/guards/passport-jwt-guard';

@Controller('cracks')
@UseGuards(PassportJwtAuthGuard)
export class CracksController {
  constructor(@Inject('CRACK_SERVICE') private readonly crackService: ClientProxy) {}

  @Get('crack-reports')
  async getAllCrackReports() {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-all-crack-report' }, {}).pipe(
        catchError(err => {
          throw new InternalServerErrorException(err.message);
        })
      )
    );
  }

  @Get('crack-reports/:id')
  async getCrackReportById(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-crack-report-by-id' }, id).pipe(
        catchError(err => {
          throw new NotFoundException(err.message);
        })
      )
    );
  }

  @Post('crack-reports')
  async createCrackReport(@Body() dto: AddCrackReportDto, @Req() req) {
    const userId = req.user.userId; // ✅ Lấy UserID từ token

    return firstValueFrom(
      this.crackService.send({ cmd: 'create-crack-report' }, { ...dto, reportedBy: userId }).pipe(
        catchError(err => {
          throw new BadRequestException(err.message);
        })
      )
    );
  }

  @Patch('crack-reports/:id')
  async updateCrackReport(@Param('id') id: string, @Body() dto: UpdateCrackReportDto) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'update-crack-report' }, { crackId: id, dto }).pipe(
        catchError(err => {
          throw new NotFoundException(err.message);
        })
      )
    );
  }

  @Delete('crack-reports/:id')
  async deleteCrackReport(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'delete-crack-report' }, id).pipe(
        catchError(err => {
          throw new NotFoundException(err.message);
        })
      )
    );
  }

  //Crack-Details
  @Get('crack-details')
  async getAllCrackDetails() {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-all-crack-details' }, {}).pipe(
        catchError(err => {
          throw new InternalServerErrorException(err.message);
        })
      )
    );
  }

  @Get('crack-details/:id')
  async getCrackDetailsById(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'get-crack-detail-by-id' }, id).pipe(
        catchError(err => {
          throw new NotFoundException(err.message);
        })
      )
    );
  }

  @Post('crack-details')
  async createCrackDetails(@Body() dto: CreateCrackDetailDto) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'create-crack-detail' }, dto).pipe(
        catchError(err => {
          if (err.response.isSuccess == false) {
            throw new NotFoundException(err.response.message);
          }
          throw new BadRequestException(err.response?.message || 'Lỗi hệ thống, vui lòng thử lại sau');
        })
      )
    );
  }


  @Patch('crack-details/:id')
  async updateCrackDetails(@Param('id') id: string, @Body() dto: UpdateCrackReportDto) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'update-crack-detail' }, { crackId: id, dto }).pipe(
        catchError(err => {
          throw new NotFoundException(err.message);
        })
      )
    );
  }

  @Delete('crack-details/:id')
  async deleteCrackDetails(@Param('id') id: string) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'delete-crack-detail' }, id).pipe(
        catchError(err => {
          throw new NotFoundException(err.message);
        })
      )
    );
  }

}
