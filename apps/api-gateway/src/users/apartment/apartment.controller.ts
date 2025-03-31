import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApartmentService } from './apartment.service';

@Controller('apartment')
export class ApartmentController {
  constructor(private apartmentService: ApartmentService) { }

  @Get(':id')
  async getApartmentById(@Param('id') id: string) {
    try {
      const result = await this.apartmentService.getApartmentById(id);
      if (!result.isSuccess) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: result.message,
          error: 'Not Found'
        });
      }
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error retrieving apartment data: ${error.message}`);
    }
  }
}
