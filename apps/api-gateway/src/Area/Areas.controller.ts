import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { AreasService } from './Areas.service'
import { catchError, NotFoundError } from 'rxjs';
import { CreateAreaDto } from '@app/contracts/Areas/create-areas.dto';
import { UpdateAreaDto } from '@app/contracts/Areas/update.areas';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  async createArea(@Body() createAreaDto: CreateAreaDto) {
    return await this.areasService.createArea(createAreaDto);
  }

  @Get() // This is the route for 'GET /areas'
  async getAllAreas() {
    console.log("🚀 ~ AreasCsdssontroller ~ getAllAreas ~ getAllAreas:")
    
    return await this.areasService.getAreas();
  }

  @Get(':id')
  async getAreaById(@Param('id') id: string) {
    return await this.areasService.getAreaById(id);
  }

  @Put(':id')
  async updateArea(@Param('id') id: string, @Body() updateAreaDto: UpdateAreaDto) {
    return await this.areasService.updateArea({ ...updateAreaDto, areaId: id });
  }

  @Delete(':id')
  async deleteArea(@Param('id') id: string) {
    return await this.areasService.deleteArea(id);
  }
}