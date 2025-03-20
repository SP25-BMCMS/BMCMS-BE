import { Controller, Get, NotFoundException, Param, UseGuards } from "@nestjs/common"
import { ApartmentService } from "./apartment.service"

@Controller('apartment')
export class ApartmentController {
    constructor(private apartmentService: ApartmentService) { }

@Get(':id')
  async getApartmentById(@Param('id') id: string) {
    try {
        console.log("🚀 ~ ApartmentControllasdasdasddsder ~ getApartmentById ~ getApartmentById:")

      // Gọi phương thức từ residentService để lấy thông tin căn hộ
      const result = await this.apartmentService.getApartmentById(id);
      if (!result) {
        throw new NotFoundException(`Apartment with ID ${id} not found`);
    }
      console.log("🚀 ~ ApartmentControllasdasdasddsder ~ getApartmentById ~ getApartmentById:", result)
      return result;
    } catch (error) {
      throw new Error(`Error retrieving apartment data: ${error.message}`);
    }
  }
}