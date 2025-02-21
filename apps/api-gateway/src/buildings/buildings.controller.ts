import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { BuildingsService } from './Buildings.service'
import { catchError, NotFoundError } from 'rxjs';

@Controller('building')
export class BuildingsController {
    constructor(private BuildingsService: BuildingsService) { }

    // @HttpCode(HttpStatus.OK)
    // @Post('login')
    // login(@Body() data: { username: string, password: string }) {
    //     return this.UsersService.login(data.username, data.password)
    // }

   
  @Get()
  async getAllBuildings() {
    return await this.BuildingsService.getBuildings();
  }

  @Get(':id')
  async getBuildingById(@Param('id') id: string) {
    return this.BuildingsService.getBuildingById(id);
  }

  @Post()
  async createBuilding(@Body() createBuildingDto: any) {
    return (await this.BuildingsService.createBuilding(createBuildingDto))

  }

  @Put(':id')
  async updateBuilding(@Param('id') id: string, @Body() updateBuildingDto: any) {
    return this.BuildingsService.updateBuilding({ ...updateBuildingDto, buildingId: id });
  }

  @Delete(':id')
  async deleteBuilding(@Param('id') id: string) {
    return this.BuildingsService.deleteBuilding(id);
  }
}