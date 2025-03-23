import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { BuildingsService } from './Buildings.service'
import { catchError, NotFoundError } from 'rxjs';
import { CreateBuildingDetailDto } from '@app/contracts/BuildingDetails/create-buildingdetails.dto';
import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto';
import { UpdateBuildingDto } from '@app/contracts/buildings/update-buildings.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ApartmentService } from '../users/apartment/apartment.service';

@Controller('building')
@ApiTags('buildings')
export class BuildingsController {
    constructor(
        private buildingsService: BuildingsService,
        private apartmentService: ApartmentService
    ) { }

  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // login(@Body() data: { username: string, password: string }) {
  //     return this.UsersService.login(data.username, data.password)
  // }

    @Get()
    @ApiOperation({ summary: 'Get all buildings with pagination' })
    @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page' })
    @ApiQuery({ name: 'search', required: false, description: 'Search term for building name or description' })
    async getAllBuildings(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string
    ) {
        return await this.buildingsService.getBuildings({
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            search: search || ''
        });
    }

    // New endpoint to get apartment with building details
    @Get('apartment/:apartmentId')
    async getApartmentWithBuilding(@Param('apartmentId') apartmentId: string) {
        try {
            console.log("🚀 ~ BuildingsController ~ getApartmentWithBuilding ~ apartmentId:", apartmentId);
            
            // This will use BuildingsService method to combine apartment and building data
            const result = await this.buildingsService.getApartmentWithBuilding(apartmentId);
            console.log("🚀 ~ BuildingsController ~ getApartmentWithBuilding ~ result:", result);
            
            return result;
        } catch (error) {
            console.error("🚀 ~ BuildingsController ~ getApartmentWithBuilding ~ error:", error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Error retrieving apartment with building: ${error.message}`);
        }
    }

    // Another endpoint using ApartmentService directly
    @Get('apartment-details/:apartmentId')
    async getApartmentWithBuildingDetails(@Param('apartmentId') apartmentId: string) {
        try {
            // Get apartment details
            const apartmentResponse = await this.apartmentService.getApartmentById(apartmentId);
            
            if (!apartmentResponse || !apartmentResponse.isSuccess) {
                throw new NotFoundException(`Apartment with ID ${apartmentId} not found`);
            }
            // Extract building ID
            const buildingId = apartmentResponse.data.buildingId;
            console.log("🚀 ~ BuildingsController ~ getApartmentWithBuildingDetails ~ buildingId:", buildingId)
            
            // Get building details
            const buildingResponse = await this.buildingsService.getBuildingById(buildingId);
            console.log("🚀 ~ BuildingsController ~ getApartmentWithBuildingDetails ~ buildingResponse:", buildingResponse)
            
            // Combine the results
            return {
                statusCode: 200,
                message: 'Apartment and building details retrieved successfully',
                data: {
                    apartment: apartmentResponse.data,
                    building: buildingResponse?.data || null
                }
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Error retrieving apartment with building details: ${error.message}`);
        }
    }

    @Get(':id')
    async getBuildingById(@Param('id') id: string) {
        try {
            console.log("🚀 ~ BuildingsController ~ getBuildingById ~ id:", id);
            const result = await this.buildingsService.getBuildingById(id);
            console.log("🚀 ~ BuildingsController ~ getBuildingById ~ result:", result);
            return result;
        } catch (error) {
            console.error("🚀 ~ BuildingsController ~ getBuildingById ~ error:", error);
            throw new Error(`Error retrieving building: ${error.message}`);
        }
    }

    @Post()
    async createBuilding(@Body() createBuildingDto: CreateBuildingDto) {
        return (await this.buildingsService.createBuilding(createBuildingDto))
    }

    @Put(':id')
    async updateBuilding(@Param('id') id: string, @Body() updateBuildingDto: UpdateBuildingDto) {
        return this.buildingsService.updateBuilding({ ...updateBuildingDto, buildingId: id });
    }

    @Delete(':id')
    async deleteBuilding(@Param('id') id: string) {
        return this.buildingsService.deleteBuilding(id);
    }
}